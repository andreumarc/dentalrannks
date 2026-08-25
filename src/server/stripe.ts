import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { appUrl, stripeEnabled } from "@/lib/env";
import { assertClinicAccess, type SessionUser } from "@/lib/authz";
import { eurosToCents } from "@/lib/money";
import { postLedgerEntry, isPrismaUniqueError } from "@/server/ledger";
import { recordAudit } from "@/server/audit";

/* -------------------------------------------------------------------------
 * Checkout: recarga de saldo
 * ---------------------------------------------------------------------- */

export type CreateTopUpResult = { url: string } | { disabled: true };

/**
 * Crea un `Payment` en PENDING y una Checkout Session de Stripe para
 * recargar el saldo de una clínica. Nunca toca el ledger: el saldo solo se
 * actualiza cuando el webhook confirma el pago.
 */
export async function createTopUpCheckout(params: {
  user: SessionUser;
  clinicId: string;
  amountEuros: number;
}): Promise<CreateTopUpResult> {
  const stripe = getStripeClient();
  if (!stripe || !stripeEnabled()) return { disabled: true };

  await assertClinicAccess(params.user, params.clinicId);

  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: params.clinicId },
    select: { id: true, name: true },
  });

  const amountCents = eurosToCents(params.amountEuros);

  const payment = await prisma.payment.create({
    data: {
      clinicId: clinic.id,
      amountCents,
      currency: "EUR",
      status: "PENDING",
      provider: "stripe",
    },
  });

  const base = appUrl();

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: payment.id,
      metadata: { clinicId: clinic.id, paymentId: payment.id },
      payment_intent_data: {
        metadata: { clinicId: clinic.id, paymentId: payment.id },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: `Recarga de saldo · ${clinic.name}`,
              description: "Recarga de saldo DentalRank para posiciones patrocinadas, clics y leads.",
            },
          },
        },
      ],
      success_url: `${base}/dashboard/saldo?clinic=${encodeURIComponent(clinic.id)}&checkout=success`,
      cancel_url: `${base}/dashboard/saldo?clinic=${encodeURIComponent(clinic.id)}&checkout=cancel`,
    });
  } catch {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: "No se pudo crear la sesión de pago" },
    });
    throw new Error("No se pudo iniciar el pago con Stripe");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: session.id },
  });

  return { url: session.url ?? `${base}/dashboard/saldo?clinic=${encodeURIComponent(clinic.id)}` };
}

/* -------------------------------------------------------------------------
 * Webhook: procesamiento idempotente de eventos
 * ---------------------------------------------------------------------- */

/**
 * Marca un Payment como SUCCEEDED solo si todavía no lo estaba (compare-and-swap).
 * Devuelve `true` únicamente para la llamada que realiza la transición, lo que
 * evita abonar dos veces el mismo pago cuando Stripe envía tanto
 * `checkout.session.completed` como `payment_intent.succeeded` (eventos con
 * `id` distintos, por lo que la idempotencia por `event.id` del ledger no
 * basta por sí sola).
 */
async function markPaymentSucceededOnce(
  paymentId: string,
  patch: { stripePaymentIntentId?: string | null; stripeSessionId?: string | null },
): Promise<boolean> {
  const result = await prisma.payment.updateMany({
    where: { id: paymentId, status: { not: "SUCCEEDED" } },
    data: {
      status: "SUCCEEDED",
      ...(patch.stripePaymentIntentId ? { stripePaymentIntentId: patch.stripePaymentIntentId } : {}),
      ...(patch.stripeSessionId ? { stripeSessionId: patch.stripeSessionId } : {}),
    },
  });
  return result.count === 1;
}

async function findPaymentForSession(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId ?? session.client_reference_id ?? undefined;
  if (paymentId) {
    const byId = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (byId) return byId;
  }
  return prisma.payment.findUnique({ where: { stripeSessionId: session.id } });
}

async function findPaymentForIntent(intent: Stripe.PaymentIntent) {
  const byIntent = await prisma.payment.findUnique({ where: { stripePaymentIntentId: intent.id } });
  if (byIntent) return byIntent;
  const paymentId = intent.metadata?.paymentId;
  if (paymentId) return prisma.payment.findUnique({ where: { id: paymentId } });
  return null;
}

async function handleCheckoutCompleted(event: Stripe.Event, session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;

  const payment = await findPaymentForSession(session);
  if (!payment) return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
  const amountCents = session.amount_total ?? payment.amountCents;

  const transitioned = await markPaymentSucceededOnce(payment.id, {
    stripePaymentIntentId: paymentIntentId,
    stripeSessionId: session.id,
  });
  if (!transitioned) return;

  await postLedgerEntry({
    clinicId: payment.clinicId,
    type: "CREDIT",
    reason: "TOPUP",
    amountCents,
    reference: payment.id,
    idempotencyKey: `stripe:${event.id}`,
    description: "Recarga de saldo vía Stripe",
  });

  await recordAudit({
    action: "payment.received",
    entity: "Payment",
    entityId: payment.id,
    metadata: { clinicId: payment.clinicId, amountCents, stripeEventId: event.id },
  });
}

async function handlePaymentIntentSucceeded(event: Stripe.Event, intent: Stripe.PaymentIntent) {
  const payment = await findPaymentForIntent(intent);
  if (!payment) return;

  // Vía de respaldo: si `checkout.session.completed` todavía no ha llegado
  // (Stripe no garantiza orden entre eventos), esta transición también
  // confirma el pago. El CAS de `markPaymentSucceededOnce` impide el doble abono.
  const transitioned = await markPaymentSucceededOnce(payment.id, { stripePaymentIntentId: intent.id });
  if (!transitioned) return;

  const amountCents = intent.amount_received || intent.amount || payment.amountCents;

  await postLedgerEntry({
    clinicId: payment.clinicId,
    type: "CREDIT",
    reason: "TOPUP",
    amountCents,
    reference: payment.id,
    idempotencyKey: `stripe:${event.id}`,
    description: "Recarga de saldo vía Stripe",
  });

  await recordAudit({
    action: "payment.received",
    entity: "Payment",
    entityId: payment.id,
    metadata: { clinicId: payment.clinicId, amountCents, stripeEventId: event.id },
  });
}

async function handlePaymentIntentFailed(event: Stripe.Event, intent: Stripe.PaymentIntent) {
  const payment = await findPaymentForIntent(intent);
  if (!payment) return;
  if (payment.status === "SUCCEEDED") return; // un pago ya completado no se revierte por un evento de fallo tardío

  const failureReason = (intent.last_payment_error?.message ?? "Pago rechazado").slice(0, 300);

  const result = await prisma.payment.updateMany({
    where: { id: payment.id, status: { not: "SUCCEEDED" } },
    data: { status: "FAILED", failureReason, stripePaymentIntentId: intent.id },
  });
  if (result.count !== 1) return;

  await recordAudit({
    action: "payment.failed",
    entity: "Payment",
    entityId: payment.id,
    metadata: { clinicId: payment.clinicId, stripeEventId: event.id, reason: failureReason },
  });
}

async function handleChargeRefunded(event: Stripe.Event, charge: Stripe.Charge) {
  const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : (charge.payment_intent?.id ?? null);
  if (!intentId) return;

  const payment = await prisma.payment.findUnique({ where: { stripePaymentIntentId: intentId } });
  if (!payment || payment.status !== "SUCCEEDED") return;

  // `charge.amount_refunded` es el importe ACUMULADO reembolsado en el cargo
  // (no el de este evento en concreto). Para admitir varios reembolsos
  // parciales sobre el mismo pago sin descontar de más, restamos lo que ya
  // se hubiera retirado en contracargos anteriores de este mismo Payment: el
  // propio ledger es la fuente de verdad de "cuánto se ha reembolsado ya".
  const alreadyChargedBack = await prisma.walletTransaction.aggregate({
    where: { clinicId: payment.clinicId, reason: "CHARGEBACK", reference: payment.id },
    _sum: { amountCents: true },
  });
  const alreadyRefundedCents = Math.abs(alreadyChargedBack._sum.amountCents ?? 0);
  const cumulativeRefundedCents = charge.amount_refunded ?? 0;
  const refundedCents = cumulativeRefundedCents - alreadyRefundedCents;
  if (refundedCents <= 0) return; // ya reflejado en el ledger (reintento o evento sin novedad)

  const isFullRefund = cumulativeRefundedCents >= charge.amount;

  const result = await prisma.payment.updateMany({
    where: { id: payment.id, status: "SUCCEEDED" },
    data: isFullRefund ? { status: "REFUNDED" } : {},
  });
  if (result.count !== 1) return; // ya procesado por otro evento

  /*
   * Nota de diseño importante: el esquema define el tipo de asiento REFUND
   * como SIEMPRE positivo (ver comentario en `WalletTransaction.amountCents`
   * en prisma/schema.prisma) — se usa para devolver a la clínica el importe
   * de un lead facturado por error (ver `adminOps.ts`). Un reembolso de
   * Stripe es la operación contraria: retira saldo que ya se había abonado
   * en una recarga. Para no invertir el signo que el propio ledger impone al
   * tipo REFUND, este caso se registra como DEBIT con motivo CHARGEBACK
   * (contracargo), que sí resta saldo. El resultado económico es el que
   * describe la consigna ("un asiento que reduce el saldo"); el tipo Prisma
   * usado es el que mantiene el signo correcto sin tocar ledger.ts.
   */
  await postLedgerEntry(
    {
      clinicId: payment.clinicId,
      type: "DEBIT",
      reason: "CHARGEBACK",
      amountCents: refundedCents,
      reference: payment.id,
      idempotencyKey: `stripe:${event.id}`,
      description: "Reembolso de recarga vía Stripe",
    },
    { allowNegative: true },
  );

  await recordAudit({
    action: "wallet.adjusted",
    entity: "Payment",
    entityId: payment.id,
    metadata: { clinicId: payment.clinicId, refundedCents, stripeEventId: event.id, kind: "stripe_refund" },
  });
}

/**
 * Procesa un evento de Stripe ya verificado. Idempotente: si `event.id` ya se
 * había registrado en `StripeEvent`, no reprocesa nada.
 */
export async function processStripeEvent(event: Stripe.Event): Promise<{ duplicate: boolean }> {
  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch (error) {
    if (isPrismaUniqueError(error)) return { duplicate: true };
    throw error;
  }

  // La fila de StripeEvent actúa como "reclamación" de este evento. Si el
  // procesamiento falla a partir de aquí, la retiramos antes de relanzar el
  // error: así el webhook devuelve 500, Stripe reintenta más tarde, y ese
  // reintento vuelve a encontrar el evento como no procesado en lugar de
  // quedar marcado como completado sin haber movido el saldo.
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event, event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event, event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event, event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event, event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }
  } catch (error) {
    await prisma.stripeEvent.delete({ where: { id: event.id } }).catch(() => {});
    throw error;
  }

  return { duplicate: false };
}
