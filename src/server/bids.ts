import { prisma } from "@/lib/prisma";
import { assertClinicAccess, requireUser, type SessionUser } from "@/lib/authz";
import { bidSchema } from "@/lib/validation";
import { computePositions, persistPositions, getOutbidQuote } from "@/server/markets";
import { postLedgerEntry, walletSummary, InsufficientFundsError } from "@/server/ledger";
import { recordAudit } from "@/server/audit";
import { getClientContext } from "@/lib/request";
import { eurosToCents } from "@/lib/money";
import { revalidatePath } from "next/cache";

/* ---------------------------------------------------------------------- */
/* Lectura: mercados de la clínica y panel de outbid                      */
/* ---------------------------------------------------------------------- */

export type OccupantRow = {
  position: number;
  isMine: boolean;
};

export type ClinicMarketRow = {
  marketId: string;
  treatmentId: string;
  treatmentName: string;
  cityId: string;
  cityName: string;
  sponsoredSlots: number;
  minimumBidCents: number;
  bidIncrementCents: number;
  myBid: { amountCents: number; status: string; maxCpcCents: number | null; cplCents: number | null } | null;
  myPosition: number | null;
  occupants: OccupantRow[];
  outbid: { requiredTotalCents: number; payNowCents: number; currentCents: number; targetPosition: number } | null;
};

/**
 * Mercados (tratamiento×municipio de la clínica) en los que la clínica puede
 * pujar: los tratamientos que ofrece, en su propio municipio.
 */
export async function getClinicMarkets(clinicId: string): Promise<ClinicMarketRow[]> {
  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: clinicId },
    select: { cityId: true, treatments: { select: { treatmentId: true } } },
  });
  if (clinic.treatments.length === 0) return [];

  const markets = await prisma.auctionMarket.findMany({
    where: {
      cityId: clinic.cityId,
      treatmentId: { in: clinic.treatments.map((t) => t.treatmentId) },
      status: "ACTIVE",
    },
    include: {
      treatment: { select: { id: true, name: true } },
      city: { select: { id: true, name: true } },
      bids: { where: { clinicId }, select: { amountCents: true, status: true, maxCpcCents: true, cplCents: true } },
    },
    orderBy: { treatment: { name: "asc" } },
  });

  const rows: ClinicMarketRow[] = [];
  for (const market of markets) {
    const ranked = await computePositions(market.id);
    const mine = ranked.find((r) => r.clinicId === clinicId);
    const occupants: OccupantRow[] = ranked.map((r) => ({ position: r.position, isMine: r.clinicId === clinicId }));

    const targetPosition = mine ? Math.max(1, mine.position - 1) : 1;
    const quote =
      mine?.position === 1
        ? null
        : await getOutbidQuote(market.id, clinicId, targetPosition);

    rows.push({
      marketId: market.id,
      treatmentId: market.treatment.id,
      treatmentName: market.treatment.name,
      cityId: market.city.id,
      cityName: market.city.name,
      sponsoredSlots: market.sponsoredSlots,
      minimumBidCents: market.minimumBidCents,
      bidIncrementCents: market.bidIncrementCents,
      myBid: market.bids[0]
        ? {
            amountCents: market.bids[0].amountCents,
            status: market.bids[0].status,
            maxCpcCents: market.bids[0].maxCpcCents,
            cplCents: market.bids[0].cplCents,
          }
        : null,
      myPosition: mine?.position ?? null,
      occupants,
      outbid: quote ? { ...quote, targetPosition } : null,
    });
  }

  return rows;
}

export async function getBudget(clinicId: string) {
  return prisma.clinicBudget.findUnique({ where: { clinicId } });
}

/* ---------------------------------------------------------------------- */
/* Puja: reclamar posición                                                */
/* ---------------------------------------------------------------------- */

export type BidFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Lógica de negocio de una puja. Recibe `user` ya autenticado por quien la
 * invoca; la única puerta de entrada segura desde el cliente es
 * `placeBidAction`, que resuelve la sesión en servidor.
 */
export async function placeBid(user: SessionUser, formData: FormData): Promise<BidFormState> {
  const raw = {
    marketId: String(formData.get("marketId") ?? ""),
    clinicId: String(formData.get("clinicId") ?? ""),
    amountEuros: String(formData.get("amountEuros") ?? ""),
  };
  const parsed = bidSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Revisa el importe introducido.", fieldErrors };
  }

  const { marketId, clinicId, amountEuros } = parsed.data;
  await assertClinicAccess(user, clinicId, { requireAdmin: true });

  const market = await prisma.auctionMarket.findUnique({
    where: { id: marketId },
    select: { id: true, minimumBidCents: true, status: true },
  });
  if (!market || market.status !== "ACTIVE") {
    return { ok: false, message: "Este mercado no está activo." };
  }

  const amountCents = eurosToCents(amountEuros);
  if (amountCents < market.minimumBidCents) {
    return {
      ok: false,
      message: `El importe mínimo para este mercado es de ${(market.minimumBidCents / 100).toFixed(2)} €.`,
    };
  }

  const existingBid = await prisma.bid.findUnique({
    where: { marketId_clinicId: { marketId, clinicId } },
  });
  const previousAmount = existingBid?.amountCents ?? 0;
  const payNowCents = amountCents - previousAmount;

  if (payNowCents <= 0) {
    return {
      ok: false,
      message: "El nuevo importe debe ser mayor que el que ya tienes comprometido.",
    };
  }

  const wallet = await walletSummary(clinicId);
  if (wallet.balanceCents < payNowCents) {
    return {
      ok: false,
      message: `Saldo insuficiente. Necesitas ${(payNowCents / 100).toFixed(2)} € y tu saldo disponible es ${(
        wallet.balanceCents / 100
      ).toFixed(2)} €. Recarga saldo antes de continuar.`,
    };
  }

  const requestId = String(formData.get("requestId") ?? `${marketId}:${clinicId}:${Date.now()}`);
  const idempotencyKey = `bid:${requestId}`;

  try {
    await postLedgerEntry({
      clinicId,
      type: "DEBIT",
      reason: "SPONSORSHIP",
      amountCents: payNowCents,
      reference: marketId,
      idempotencyKey,
      description: `Puja patrocinada: ${previousAmount > 0 ? "incremento" : "nueva"} hasta ${(amountCents / 100).toFixed(2)} €`,
      createdById: user.id,
    });
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      return { ok: false, message: "Saldo insuficiente para completar la puja." };
    }
    throw err;
  }

  const bid = await prisma.bid.upsert({
    where: { marketId_clinicId: { marketId, clinicId } },
    create: {
      marketId,
      clinicId,
      amountCents,
      status: "ACTIVE",
      reachedAmountAt: new Date(),
    },
    update: {
      amountCents,
      status: "ACTIVE",
      reachedAmountAt: new Date(),
    },
  });

  await prisma.bidHistory.create({
    data: {
      bidId: bid.id,
      fromAmountCents: previousAmount,
      toAmountCents: amountCents,
      reason: "Ajuste manual desde el panel de posiciones",
    },
  });

  await persistPositions(marketId);

  const ctx = await getClientContext();
  await recordAudit({
    action: "bid.updated",
    entity: "Bid",
    entityId: bid.id,
    actorId: user.id,
    actorEmail: user.email,
    metadata: { marketId, clinicId, fromAmountCents: previousAmount, toAmountCents: amountCents },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/posiciones");
  revalidatePath("/dashboard/saldo");
  revalidatePath("/dashboard");

  return { ok: true, message: `Puja actualizada a ${(amountCents / 100).toFixed(2)} €.` };
}

export async function updateClinicBudget(user: SessionUser, formData: FormData): Promise<{ ok: boolean; message: string }> {
  const clinicId = String(formData.get("clinicId") ?? "");
  if (!clinicId) return { ok: false, message: "Clínica no válida." };
  await assertClinicAccess(user, clinicId, { requireAdmin: true });

  const monthlyBudgetEuros = Number(formData.get("monthlyBudgetEuros") ?? 0);
  const maxCpcEuros = String(formData.get("maxCpcEuros") ?? "").trim();
  const targetCplEuros = String(formData.get("targetCplEuros") ?? "").trim();

  if (!Number.isFinite(monthlyBudgetEuros) || monthlyBudgetEuros < 0) {
    return { ok: false, message: "El presupuesto mensual no es válido." };
  }

  await prisma.clinicBudget.upsert({
    where: { clinicId },
    create: {
      clinicId,
      monthlyBudgetCents: eurosToCents(monthlyBudgetEuros),
      maxCpcCents: maxCpcEuros ? eurosToCents(Number(maxCpcEuros)) : null,
      targetCplCents: targetCplEuros ? eurosToCents(Number(targetCplEuros)) : null,
    },
    update: {
      monthlyBudgetCents: eurosToCents(monthlyBudgetEuros),
      maxCpcCents: maxCpcEuros ? eurosToCents(Number(maxCpcEuros)) : null,
      targetCplCents: targetCplEuros ? eurosToCents(Number(targetCplEuros)) : null,
    },
  });

  const ctx = await getClientContext();
  await recordAudit({
    action: "clinic.updated",
    entity: "ClinicBudget",
    entityId: clinicId,
    actorId: user.id,
    actorEmail: user.email,
    metadata: { source: "dashboard.posiciones.budget" },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/posiciones");
  return { ok: true, message: "Presupuesto actualizado." };
}

/* ---------------------------------------------------------------------- */
/* Server Actions expuestas al cliente                                    */
/* ---------------------------------------------------------------------- */

export async function placeBidAction(_prev: BidFormState, formData: FormData): Promise<BidFormState> {
  const user = await requireUser();
  return placeBid(user, formData);
}

export async function updateClinicBudgetAction(
  _prev: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  return updateClinicBudget(user, formData);
}
