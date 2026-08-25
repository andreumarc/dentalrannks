import { prisma } from "@/lib/prisma";
import { hashIp } from "@/lib/hash";

export type AuditAction =
  | "clinic.created"
  | "clinic.updated"
  | "clinic.published"
  | "clinic.verified"
  | "bid.created"
  | "bid.updated"
  | "bid.paused"
  | "payment.received"
  | "payment.failed"
  | "wallet.adjusted"
  | "lead.created"
  | "lead.status_changed"
  | "lead.quality_reviewed"
  | "lead.exported"
  | "user.invited"
  | "user.login"
  | "organization.created"
  | "market.created"
  | "import.clinics";

export async function recordAudit(params: {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        actorId: params.actorId ?? null,
        actorEmail: params.actorEmail ?? null,
        metadata: (params.metadata ?? {}) as object,
        ipHash: hashIp(params.ip),
        userAgent: params.userAgent?.slice(0, 400) ?? null,
      },
    });
  } catch {
    // El registro de auditoría nunca debe romper la operación de negocio.
  }
}
