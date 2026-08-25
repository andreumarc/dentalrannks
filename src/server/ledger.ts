import { Prisma, type LedgerEntryType, type LedgerReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Libro mayor de la clínica.
 *
 * Reglas:
 *  - La fuente de verdad del saldo es la suma de los asientos, no `wallet.balanceCents`.
 *  - `wallet.balanceCents` es una caché derivada que se recalcula en cada asiento.
 *  - Ningún asiento se escribe desde el cliente; solo desde servidor.
 *  - Todo asiento con `idempotencyKey` es reintentable sin duplicar dinero.
 */

export type LedgerEntryInput = {
  clinicId: string;
  type: LedgerEntryType;
  reason: LedgerReason;
  /** Importe SIEMPRE positivo en céntimos. El signo lo decide `type`. */
  amountCents: number;
  reference?: string | null;
  idempotencyKey?: string | null;
  description?: string | null;
  createdById?: string | null;
};

export class InsufficientFundsError extends Error {
  constructor(public readonly balanceCents: number) {
    super("Saldo insuficiente");
    this.name = "InsufficientFundsError";
  }
}

function signedAmount(type: LedgerEntryType, amountCents: number): number {
  const abs = Math.abs(Math.round(amountCents));
  return type === "DEBIT" ? -abs : abs;
}

export async function postLedgerEntry(input: LedgerEntryInput, opts?: { allowNegative?: boolean }) {
  if (!Number.isFinite(input.amountCents) || Math.round(input.amountCents) === 0) {
    throw new Error("El importe del asiento debe ser distinto de cero");
  }

  return prisma.$transaction(async (tx) => {
    if (input.idempotencyKey) {
      const existing = await tx.walletTransaction.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) return existing;
    }

    const wallet = await tx.wallet.upsert({
      where: { clinicId: input.clinicId },
      create: { clinicId: input.clinicId, balanceCents: 0 },
      update: {},
    });

    const delta = signedAmount(input.type, input.amountCents);
    const nextBalance = wallet.balanceCents + delta;

    if (nextBalance < 0 && !opts?.allowNegative) {
      throw new InsufficientFundsError(wallet.balanceCents);
    }

    const entry = await tx.walletTransaction.create({
      data: {
        clinicId: input.clinicId,
        type: input.type,
        reason: input.reason,
        amountCents: delta,
        balanceAfterCents: nextBalance,
        reference: input.reference ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
        description: input.description ?? null,
        createdById: input.createdById ?? null,
      },
    });

    await tx.wallet.update({
      where: { clinicId: input.clinicId },
      data: { balanceCents: nextBalance },
    });

    return entry;
  });
}

/** Saldo real recalculado desde el ledger. Úsalo para conciliar. */
export async function ledgerBalance(clinicId: string): Promise<number> {
  const result = await prisma.walletTransaction.aggregate({
    where: { clinicId },
    _sum: { amountCents: true },
  });
  return result._sum.amountCents ?? 0;
}

/** Detecta descuadres entre la caché `wallet.balanceCents` y el ledger. */
export async function reconcile(clinicId: string) {
  const [wallet, real] = await Promise.all([
    prisma.wallet.findUnique({ where: { clinicId } }),
    ledgerBalance(clinicId),
  ]);
  const cached = wallet?.balanceCents ?? 0;
  return { cachedCents: cached, ledgerCents: real, driftCents: cached - real };
}

export async function walletSummary(clinicId: string) {
  const [wallet, spend] = await Promise.all([
    prisma.wallet.findUnique({ where: { clinicId } }),
    prisma.walletTransaction.aggregate({
      where: { clinicId, type: "DEBIT" },
      _sum: { amountCents: true },
    }),
  ]);
  return {
    balanceCents: wallet?.balanceCents ?? 0,
    lowBalanceThresholdCents: wallet?.lowBalanceThresholdCents ?? 5000,
    lifetimeSpendCents: Math.abs(spend._sum.amountCents ?? 0),
  };
}

export const isPrismaUniqueError = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
