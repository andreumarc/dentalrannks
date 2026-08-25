import { prisma } from "@/lib/prisma";
import { assertClinicAccess, requireUser, type SessionUser } from "@/lib/authz";
import { leadStatusSchema } from "@/lib/validation";
import { recordAudit } from "@/server/audit";
import { getClientContext } from "@/lib/request";
import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@prisma/client";

/* ---------------------------------------------------------------------- */
/* Listado de leads (con filtros resueltos en servidor)                   */
/* ---------------------------------------------------------------------- */

export type LeadFilters = {
  status?: LeadStatus;
  treatmentId?: string;
  from?: string;
  to?: string;
  q?: string;
  page: number;
};

export type LeadRow = {
  id: string;
  createdAt: Date;
  name: string;
  phone: string;
  email: string;
  treatmentName: string | null;
  cityName: string | null;
  source: string;
  status: LeadStatus;
  clinicName: string;
};

const PAGE_SIZE = 25;

function buildLeadWhere(clinicId: string, filters: LeadFilters) {
  const where: Record<string, unknown> = { clinicId };
  if (filters.status) where.status = filters.status;
  if (filters.treatmentId) where.treatmentId = filters.treatmentId;
  if (filters.from || filters.to) {
    const createdAt: Record<string, Date> = {};
    if (filters.from) createdAt.gte = new Date(`${filters.from}T00:00:00`);
    if (filters.to) createdAt.lte = new Date(`${filters.to}T23:59:59`);
    where.createdAt = createdAt;
  }
  if (filters.q) {
    const q = filters.q.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
  }
  return where;
}

export async function getLeadsPage(
  clinicId: string,
  clinicName: string,
  filters: LeadFilters,
): Promise<{ rows: LeadRow[]; total: number; page: number; pageSize: number }> {
  const where = buildLeadWhere(clinicId, filters);
  const page = Math.max(1, filters.page);

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        createdAt: true,
        name: true,
        phone: true,
        email: true,
        source: true,
        status: true,
        treatment: { select: { name: true } },
        city: { select: { name: true } },
      },
    }),
  ]);

  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    createdAt: l.createdAt,
    name: l.name,
    phone: l.phone,
    email: l.email,
    treatmentName: l.treatment?.name ?? null,
    cityName: l.city?.name ?? null,
    source: l.source,
    status: l.status,
    clinicName,
  }));

  return { rows, total, page, pageSize: PAGE_SIZE };
}

export async function getLeadFilterOptions(clinicId: string) {
  const rows = await prisma.lead.findMany({
    where: { clinicId, treatmentId: { not: null } },
    distinct: ["treatmentId"],
    select: { treatment: { select: { id: true, name: true } } },
  });
  return rows
    .filter((r) => r.treatment)
    .map((r) => r.treatment!)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ---------------------------------------------------------------------- */
/* Exportación CSV                                                        */
/* ---------------------------------------------------------------------- */

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function exportLeadsCsv(
  user: SessionUser,
  clinicId: string,
  clinicName: string,
  filters: LeadFilters,
): Promise<{ ok: boolean; csv?: string; message?: string }> {
  await assertClinicAccess(user, clinicId);

  const where = buildLeadWhere(clinicId, filters);
  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      createdAt: true,
      name: true,
      phone: true,
      email: true,
      status: true,
      source: true,
      treatment: { select: { name: true } },
      city: { select: { name: true } },
    },
  });

  const header = ["Fecha", "Paciente", "Teléfono", "Email", "Tratamiento", "Ciudad", "Origen", "Estado", "Clínica"];
  const lines = [header.join(";")];
  for (const l of leads) {
    lines.push(
      [
        l.createdAt.toISOString().slice(0, 10),
        l.name,
        l.phone,
        l.email,
        l.treatment?.name ?? "",
        l.city?.name ?? "",
        l.source,
        l.status,
        clinicName,
      ]
        .map((v) => csvEscape(String(v)))
        .join(";"),
    );
  }

  const ctx = await getClientContext();
  await recordAudit({
    action: "lead.exported",
    entity: "Lead",
    actorId: user.id,
    actorEmail: user.email,
    metadata: { clinicId, count: leads.length, filters },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: true, csv: lines.join("\n") };
}

/* ---------------------------------------------------------------------- */
/* Detalle de lead / CRM                                                  */
/* ---------------------------------------------------------------------- */

export async function getLeadDetail(user: SessionUser, leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      treatment: { select: { name: true } },
      city: { select: { name: true } },
      clinic: { select: { id: true, name: true, organizationId: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      notes: { orderBy: { createdAt: "desc" } },
      consents: { orderBy: { createdAt: "desc" } },
      events: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  if (!lead) return null;

  await assertClinicAccess(user, lead.clinicId);
  return lead;
}

export async function getOrgUsersForClinic(clinicId: string) {
  const clinic = await prisma.clinic.findUniqueOrThrow({ where: { id: clinicId }, select: { organizationId: true } });
  const members = await prisma.organizationUser.findMany({
    where: { organizationId: clinic.organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return members.map((m) => ({ id: m.user.id, name: m.user.name ?? m.user.email, email: m.user.email }));
}

/* ---------------------------------------------------------------------- */
/* Mutaciones                                                             */
/* ---------------------------------------------------------------------- */

export type LeadFormState = { ok: boolean; message: string; fieldErrors?: Record<string, string> };

const NEXT_STAGE: Partial<Record<LeadStatus, LeadStatus>> = {
  NEW: "CONTACTED",
  CONTACTED: "APPOINTMENT",
  APPOINTMENT: "ATTENDED",
  ATTENDED: "BUDGET",
  BUDGET: "ACCEPTED",
};

export async function changeLeadStatus(user: SessionUser, formData: FormData): Promise<LeadFormState> {
  const raw = {
    leadId: String(formData.get("leadId") ?? ""),
    status: String(formData.get("status") ?? ""),
    note: String(formData.get("note") ?? "") || undefined,
  };
  const parsed = leadStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "No se pudo actualizar el estado." };
  }

  const lead = await prisma.lead.findUnique({ where: { id: parsed.data.leadId }, select: { clinicId: true, status: true } });
  if (!lead) return { ok: false, message: "El lead ya no existe." };
  await assertClinicAccess(user, lead.clinicId);

  const fromStatus = lead.status;
  const toStatus = parsed.data.status;

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: parsed.data.leadId },
      data: {
        status: toStatus,
        lastContactAt: toStatus === "CONTACTED" ? new Date() : undefined,
        closedAt: toStatus === "ACCEPTED" || toStatus === "LOST" ? new Date() : undefined,
      },
    });
    await tx.leadEvent.create({
      data: {
        leadId: parsed.data.leadId,
        type: "STATUS_CHANGED",
        fromStatus,
        toStatus,
        message: parsed.data.note ?? null,
        userId: user.id,
      },
    });
    if (parsed.data.note) {
      await tx.leadNote.create({
        data: { leadId: parsed.data.leadId, body: parsed.data.note, authorId: user.id },
      });
    }
  });

  const ctx = await getClientContext();
  await recordAudit({
    action: "lead.status_changed",
    entity: "Lead",
    entityId: parsed.data.leadId,
    actorId: user.id,
    actorEmail: user.email,
    metadata: { fromStatus, toStatus },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  revalidatePath(`/dashboard/leads/${parsed.data.leadId}`);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");

  return { ok: true, message: "Estado actualizado." };
}

export async function addLeadNote(user: SessionUser, formData: FormData): Promise<LeadFormState> {
  const leadId = String(formData.get("leadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!leadId) return { ok: false, message: "Lead no válido." };
  if (!body || body.length > 2000) return { ok: false, message: "Escribe una nota de hasta 2000 caracteres." };

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { clinicId: true } });
  if (!lead) return { ok: false, message: "El lead ya no existe." };
  await assertClinicAccess(user, lead.clinicId);

  await prisma.$transaction([
    prisma.leadNote.create({ data: { leadId, body, authorId: user.id } }),
    prisma.leadEvent.create({ data: { leadId, type: "NOTE_ADDED", message: body.slice(0, 160), userId: user.id } }),
  ]);

  revalidatePath(`/dashboard/leads/${leadId}`);
  return { ok: true, message: "Nota añadida." };
}

export async function assignLead(user: SessionUser, formData: FormData): Promise<LeadFormState> {
  const leadId = String(formData.get("leadId") ?? "");
  const assigneeId = String(formData.get("userId") ?? "") || null;
  if (!leadId) return { ok: false, message: "Lead no válido." };

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { clinicId: true } });
  if (!lead) return { ok: false, message: "El lead ya no existe." };
  await assertClinicAccess(user, lead.clinicId);

  if (assigneeId) {
    const clinic = await prisma.clinic.findUniqueOrThrow({ where: { id: lead.clinicId }, select: { organizationId: true } });
    const membership = await prisma.organizationUser.findUnique({
      where: { organizationId_userId: { organizationId: clinic.organizationId, userId: assigneeId } },
    });
    if (!membership) return { ok: false, message: "Esa persona no pertenece a la organización." };
  }

  await prisma.$transaction([
    prisma.lead.update({ where: { id: leadId }, data: { assignedToId: assigneeId } }),
    prisma.leadEvent.create({
      data: { leadId, type: "ASSIGNED", message: assigneeId ?? "sin asignar", userId: user.id },
    }),
  ]);

  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/leads");
  return { ok: true, message: "Asignación actualizada." };
}

export { NEXT_STAGE };

/* ---------------------------------------------------------------------- */
/* Server Actions expuestas al cliente                                    */
/* ---------------------------------------------------------------------- */

export async function changeLeadStatusAction(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const user = await requireUser();
  return changeLeadStatus(user, formData);
}

export async function addLeadNoteAction(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const user = await requireUser();
  return addLeadNote(user, formData);
}

export async function assignLeadAction(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const user = await requireUser();
  return assignLead(user, formData);
}

export async function exportLeadsCsvAction(
  clinicId: string,
  clinicName: string,
  filters: LeadFilters,
): Promise<{ ok: boolean; csv?: string; message?: string }> {
  const user = await requireUser();
  return exportLeadsCsv(user, clinicId, clinicName, filters);
}
