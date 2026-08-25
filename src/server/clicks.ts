import { prisma } from "@/lib/prisma";
import { hashIp } from "@/lib/hash";
import { postLedgerEntry } from "@/server/ledger";
import type { ClickType } from "@prisma/client";

/** Ventana en la que un mismo visitante no genera un segundo clic facturable. */
const DEDUPE_WINDOW_MINUTES = 30;

export async function registerClick(params: {
  clinicId: string;
  type: ClickType;
  marketId?: string | null;
  treatmentId?: string | null;
  cityId?: string | null;
  position?: number | null;
  sponsored?: boolean;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}) {
  const ipHash = hashIp(params.ip);

  const recent = ipHash
    ? await prisma.click.findFirst({
        where: {
          clinicId: params.clinicId,
          ipHash,
          type: params.type,
          createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MINUTES * 60 * 1000) },
        },
        select: { id: true },
      })
    : null;

  const bid =
    params.sponsored && params.marketId
      ? await prisma.bid.findFirst({
          where: { marketId: params.marketId, clinicId: params.clinicId, status: "ACTIVE" },
          select: { maxCpcCents: true, market: { select: { pricingModel: true } } },
        })
      : null;

  const costCents =
    !recent && bid?.market.pricingModel === "CPC" && bid.maxCpcCents ? bid.maxCpcCents : 0;

  const click = await prisma.click.create({
    data: {
      clinicId: params.clinicId,
      marketId: params.marketId ?? null,
      treatmentId: params.treatmentId ?? null,
      cityId: params.cityId ?? null,
      type: params.type,
      position: params.position ?? null,
      sponsored: Boolean(params.sponsored),
      costCents,
      valid: !recent,
      invalidReason: recent ? "DUPLICATE_WINDOW" : null,
      ipHash,
      userAgent: params.userAgent?.slice(0, 400) ?? null,
      referrer: params.referrer?.slice(0, 400) ?? null,
    },
    select: { id: true },
  });

  if (costCents > 0) {
    try {
      await postLedgerEntry(
        {
          clinicId: params.clinicId,
          type: "DEBIT",
          reason: "CLICK",
          amountCents: costCents,
          reference: click.id,
          idempotencyKey: `click:${click.id}`,
          description: "Clic patrocinado",
        },
        { allowNegative: true },
      );
      await prisma.click.update({ where: { id: click.id }, data: { billed: true } });
    } catch {
      // El clic se registra aunque el cobro falle; queda pendiente de facturar.
    }
  }

  return click;
}
