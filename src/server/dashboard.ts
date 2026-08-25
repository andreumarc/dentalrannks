import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { assertClinicAccess, assertOrgAccess, requireUser, type SessionUser } from "@/lib/authz";
import { membershipsOf } from "@/lib/authz";
import { clinicProfileSchema } from "@/lib/validation";
import { recordAudit } from "@/server/audit";
import { walletSummary } from "@/server/ledger";
import { getClientContext } from "@/lib/request";
import { revalidatePath } from "next/cache";
import type { LeadStatus, OrgRole } from "@prisma/client";
import { eurosToCents } from "@/lib/money";
import { randomBytes } from "node:crypto";

/* ---------------------------------------------------------------------- */
/* Clínica activa y selector                                              */
/* ---------------------------------------------------------------------- */

export type ClinicSummary = {
  id: string;
  name: string;
  slug: string;
  cityName: string;
  status: string;
  organizationId: string;
  organizationName: string;
  role: OrgRole;
};

/** Clínicas visibles para el usuario, agrupadas por sus organizaciones. */
export const getUserClinics = cache(async (user: SessionUser): Promise<ClinicSummary[]> => {
  const memberships = await membershipsOf(user.id);
  if (memberships.length === 0) return [];

  const clinics = await prisma.clinic.findMany({
    where: { organizationId: { in: memberships.map((m) => m.organizationId) } },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      organizationId: true,
      city: { select: { name: true } },
      organization: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const roleByOrg = new Map(memberships.map((m) => [m.organizationId, m.role]));

  return clinics.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    cityName: c.city.name,
    status: c.status,
    organizationId: c.organizationId,
    organizationName: c.organization.name,
    role: user.role === "SUPER_ADMIN" ? ("CLINIC_ADMIN" as OrgRole) : (roleByOrg.get(c.organizationId) ?? ("CLINIC_USER" as OrgRole)),
  }));
});

export type ActiveClinicContext = {
  clinic: {
    id: string;
    name: string;
    slug: string;
    status: string;
    organizationId: string;
    organizationName: string;
    cityId: string;
    cityName: string;
  };
  role: OrgRole;
  isAdmin: boolean;
  clinics: ClinicSummary[];
};

/**
 * Resuelve la clínica activa del dashboard a partir del parámetro `?clinic=`,
 * validando siempre el acceso en servidor. Si no hay parámetro (o no es
 * accesible) se usa la primera clínica disponible del usuario.
 */
export const resolveActiveClinic = cache(async (
  user: SessionUser,
  requestedClinicId?: string | null,
): Promise<ActiveClinicContext | null> => {
  const clinics = await getUserClinics(user);
  if (clinics.length === 0) return null;

  const selected = clinics.find((c) => c.id === requestedClinicId) ?? clinics[0];

  await assertClinicAccess(user, selected.id);

  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: selected.id },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      organizationId: true,
      cityId: true,
      city: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });

  let role: OrgRole = "CLINIC_USER";
  if (user.role !== "SUPER_ADMIN") {
    const membership = await prisma.organizationUser.findUnique({
      where: { organizationId_userId: { organizationId: clinic.organizationId, userId: user.id } },
      select: { role: true },
    });
    role = membership?.role ?? "CLINIC_USER";
  } else {
    role = "CLINIC_ADMIN";
  }

  return {
    clinic: {
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      status: clinic.status,
      organizationId: clinic.organizationId,
      organizationName: clinic.organization.name,
      cityId: clinic.cityId,
      cityName: clinic.city.name,
    },
    role,
    isAdmin: role === "CLINIC_ADMIN",
    clinics,
  };
});

/**
 * Atajo usado por todas las páginas del dashboard: exige sesión y resuelve
 * la clínica activa. Devuelve `null` si el usuario no tiene ninguna clínica.
 */
export async function requireActiveClinic(
  requestedClinicId?: string | null,
): Promise<{ user: SessionUser; active: ActiveClinicContext | null }> {
  const user = await requireUser();
  const active = await resolveActiveClinic(user, requestedClinicId ?? null);
  return { user, active };
}

/* ---------------------------------------------------------------------- */
/* KPIs del resumen                                                       */
/* ---------------------------------------------------------------------- */

export type PeriodDays = 7 | 30 | 90;

export function parsePeriod(value?: string | null): PeriodDays {
  if (value === "7") return 7;
  if (value === "90") return 90;
  return 30;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const STAGE_ORDER: LeadStatus[] = ["NEW", "CONTACTED", "APPOINTMENT", "ATTENDED", "BUDGET", "ACCEPTED"];

const STAGE_LABELS: Record<LeadStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  APPOINTMENT: "Cita",
  ATTENDED: "Asistido",
  BUDGET: "Presupuesto",
  ACCEPTED: "Aceptado",
  LOST: "Perdido",
};

export { STAGE_LABELS };

async function loadLeadsForPeriod(clinicId: string, since: Date) {
  const leads = await prisma.lead.findMany({
    where: { clinicId, createdAt: { gte: since } },
    select: { id: true, status: true, createdAt: true, quality: true },
  });
  const leadIds = leads.map((l) => l.id);
  const events =
    leadIds.length > 0
      ? await prisma.leadEvent.findMany({
          where: { leadId: { in: leadIds }, toStatus: { not: null } },
          select: { leadId: true, toStatus: true },
        })
      : [];

  const reached = new Map<string, Set<LeadStatus>>();
  for (const l of leads) reached.set(l.id, new Set<LeadStatus>([l.status]));
  for (const e of events) {
    if (!e.toStatus) continue;
    reached.get(e.leadId)?.add(e.toStatus);
  }

  return { leads, reached };
}

export type DashboardKpis = {
  leads: number;
  appointments: number;
  clicks: number;
  spendCents: number;
  cplCents: number | null;
  conversionRate: number;
  bestPosition: { position: number; treatmentName: string; cityName: string } | null;
  series: { date: string; leads: number; clicks: number; spendCents: number }[];
};

export async function getDashboardKpis(clinicId: string, days: PeriodDays): Promise<DashboardKpis> {
  const since = daysAgo(days);

  const [{ leads, reached }, clicksRaw, spendRaw, bestPositionRow] = await Promise.all([
    loadLeadsForPeriod(clinicId, since),
    prisma.click.findMany({
      where: { clinicId, valid: true, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.walletTransaction.findMany({
      where: { clinicId, type: "DEBIT", createdAt: { gte: since } },
      select: { createdAt: true, amountCents: true },
    }),
    prisma.sponsoredPosition.findFirst({
      where: { clinicId },
      orderBy: { position: "asc" },
      select: {
        position: true,
        market: { select: { treatment: { select: { name: true } }, city: { select: { name: true } } } },
      },
    }),
  ]);

  const appointments = leads.filter((l) => reached.get(l.id)?.has("APPOINTMENT")).length;
  const accepted = leads.filter((l) => reached.get(l.id)?.has("ACCEPTED")).length;
  const spendCents = spendRaw.reduce((s, t) => s + Math.abs(t.amountCents), 0);

  const series = new Map<string, { leads: number; clicks: number; spendCents: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    series.set(dateKey(d), { leads: 0, clicks: 0, spendCents: 0 });
  }
  for (const l of leads) {
    const key = dateKey(l.createdAt);
    const bucket = series.get(key);
    if (bucket) bucket.leads += 1;
  }
  for (const c of clicksRaw) {
    const key = dateKey(c.createdAt);
    const bucket = series.get(key);
    if (bucket) bucket.clicks += 1;
  }
  for (const t of spendRaw) {
    const key = dateKey(t.createdAt);
    const bucket = series.get(key);
    if (bucket) bucket.spendCents += Math.abs(t.amountCents);
  }

  return {
    leads: leads.length,
    appointments,
    clicks: clicksRaw.length,
    spendCents,
    cplCents: leads.length > 0 ? Math.round(spendCents / leads.length) : null,
    conversionRate: leads.length > 0 ? Math.round((accepted / leads.length) * 1000) / 10 : 0,
    bestPosition: bestPositionRow
      ? {
          position: bestPositionRow.position,
          treatmentName: bestPositionRow.market.treatment.name,
          cityName: bestPositionRow.market.city.name,
        }
      : null,
    series: [...series.entries()].map(([date, v]) => ({ date, ...v })),
  };
}

export type FunnelStage = { key: LeadStatus; label: string; count: number; pct: number };

export async function getFunnel(
  clinicId: string,
  days: PeriodDays,
): Promise<{ stages: FunnelStage[]; totalLeads: number; lost: number }> {
  const since = daysAgo(days);
  const { leads, reached } = await loadLeadsForPeriod(clinicId, since);

  const total = leads.length;
  const stages = STAGE_ORDER.filter((s) => s !== "BUDGET").map((key) => {
    const count = leads.filter((l) => reached.get(l.id)?.has(key)).length;
    return { key, label: STAGE_LABELS[key], count, pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 };
  });
  const lost = leads.filter((l) => l.status === "LOST").length;

  return { stages, totalLeads: total, lost };
}

/* ---------------------------------------------------------------------- */
/* Analítica: desglose por tratamiento y por ciudad                       */
/* ---------------------------------------------------------------------- */

export type BreakdownRow = {
  id: string;
  name: string;
  clicks: number;
  leads: number;
  spendCents: number;
  cplCents: number | null;
};

async function breakdownBy(
  clinicId: string,
  since: Date,
  dimension: "treatmentId" | "cityId",
): Promise<BreakdownRow[]> {
  const [clicks, leads] = await Promise.all([
    prisma.click.groupBy({
      by: [dimension],
      where: { clinicId, createdAt: { gte: since }, [dimension]: { not: null } },
      _count: { _all: true },
      _sum: { costCents: true },
    }),
    prisma.lead.groupBy({
      by: [dimension],
      where: { clinicId, createdAt: { gte: since }, [dimension]: { not: null } },
      _count: { _all: true },
      _sum: { priceCents: true },
    }),
  ]);

  const ids = new Set<string>();
  for (const c of clicks) {
    const id = c[dimension] as string | null;
    if (id) ids.add(id);
  }
  for (const l of leads) {
    const id = l[dimension] as string | null;
    if (id) ids.add(id);
  }
  if (ids.size === 0) return [];

  const names = new Map<string, string>();
  if (dimension === "treatmentId") {
    const rows = await prisma.treatment.findMany({ where: { id: { in: [...ids] } }, select: { id: true, name: true } });
    for (const r of rows) names.set(r.id, r.name);
  } else {
    const rows = await prisma.city.findMany({ where: { id: { in: [...ids] } }, select: { id: true, name: true } });
    for (const r of rows) names.set(r.id, r.name);
  }

  return [...ids].map((id) => {
    const clickRow = clicks.find((c) => c[dimension] === id);
    const leadRow = leads.find((l) => l[dimension] === id);
    const clickCount = clickRow?._count._all ?? 0;
    const leadCount = leadRow?._count._all ?? 0;
    const spendCents = (clickRow?._sum.costCents ?? 0) + (leadRow?._sum.priceCents ?? 0);
    return {
      id,
      name: names.get(id) ?? "—",
      clicks: clickCount,
      leads: leadCount,
      spendCents,
      cplCents: leadCount > 0 ? Math.round(spendCents / leadCount) : null,
    };
  }).sort((a, b) => b.spendCents - a.spendCents);
}

export async function getTreatmentBreakdown(clinicId: string, days: PeriodDays): Promise<BreakdownRow[]> {
  return breakdownBy(clinicId, daysAgo(days), "treatmentId");
}

export async function getCityBreakdown(clinicId: string, days: PeriodDays): Promise<BreakdownRow[]> {
  return breakdownBy(clinicId, daysAgo(days), "cityId");
}

/** Mercados (tratamiento×ciudad) activos donde opera la clínica; base para Market Insights. */
export async function getClinicMarketIds(clinicId: string): Promise<{ id: string; treatmentName: string; cityName: string }[]> {
  const rows = await prisma.auctionMarket.findMany({
    where: { OR: [{ bids: { some: { clinicId } } }, { clicks: { some: { clinicId } } }] },
    select: { id: true, treatment: { select: { name: true } }, city: { select: { name: true } } },
  });
  return rows.map((r) => ({ id: r.id, treatmentName: r.treatment.name, cityName: r.city.name }));
}

/* ---------------------------------------------------------------------- */
/* Saldo                                                                  */
/* ---------------------------------------------------------------------- */

export async function getWalletPageData(clinicId: string, page = 1, pageSize = 25) {
  const [summary, total, transactions] = await Promise.all([
    walletSummary(clinicId),
    prisma.walletTransaction.count({ where: { clinicId } }),
    prisma.walletTransaction.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { summary, total, page, pageSize, transactions };
}

/* ---------------------------------------------------------------------- */
/* Perfil de clínica                                                      */
/* ---------------------------------------------------------------------- */

function computeProfileCompleteness(clinic: {
  description: string | null;
  tagline: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  website: string | null;
  scheduleJson: unknown;
  languages: string[];
  facilities: string[];
  treatmentsCount: number;
  teamCount: number;
  imagesCount: number;
}): number {
  const checks = [
    Boolean(clinic.description && clinic.description.length > 40),
    Boolean(clinic.tagline),
    Boolean(clinic.logoUrl),
    Boolean(clinic.coverUrl),
    Boolean(clinic.phone),
    Boolean(clinic.website),
    Boolean(clinic.scheduleJson),
    clinic.languages.length > 0,
    clinic.facilities.length > 0,
    clinic.treatmentsCount > 0,
    clinic.teamCount > 0,
    clinic.imagesCount > 0,
  ];
  const score = checks.filter(Boolean).length / checks.length;
  return Math.round(score * 100);
}

export async function getClinicProfileData(clinicId: string) {
  const [clinic, treatments, allTreatments] = await Promise.all([
    prisma.clinic.findUniqueOrThrow({
      where: { id: clinicId },
      include: { _count: { select: { images: true, team: true } } },
    }),
    prisma.clinicTreatment.findMany({ where: { clinicId }, include: { treatment: true } }),
    prisma.treatment.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], include: { category: true } }),
  ]);

  return { clinic, treatments, allTreatments };
}

/**
 * Lógica de negocio. NO lleva "use server": recibe `user` ya autenticado por
 * quien la invoca. La acción expuesta al cliente es `updateClinicProfileAction`,
 * que resuelve la sesión en servidor y nunca confía en un `user` del cliente.
 */
export async function updateClinicProfile(
  user: SessionUser,
  formData: FormData,
): Promise<{ ok: boolean; message: string; fieldErrors?: Record<string, string> }> {
  const raw = {
    clinicId: String(formData.get("clinicId") ?? ""),
    name: String(formData.get("name") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    description: String(formData.get("description") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    email: String(formData.get("email") ?? ""),
    website: String(formData.get("website") ?? ""),
    address: String(formData.get("address") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    firstVisitFree: formData.get("firstVisitFree") === "on",
    financing: formData.get("financing") === "on",
    emergency24h: formData.get("emergency24h") === "on",
    parking: formData.get("parking") === "on",
    accessible: formData.get("accessible") === "on",
    languages: String(formData.get("languages") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    diagnostics: String(formData.get("diagnostics") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  const parsed = clinicProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors };
  }

  await assertClinicAccess(user, parsed.data.clinicId, { requireAdmin: true });

  const data = parsed.data;
  await prisma.clinic.update({
    where: { id: data.clinicId },
    data: {
      name: data.name,
      tagline: data.tagline || null,
      description: data.description || null,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      website: data.website || null,
      address: data.address,
      postalCode: data.postalCode,
      firstVisitFree: data.firstVisitFree,
      financing: data.financing,
      emergency24h: data.emergency24h,
      parking: data.parking,
      accessible: data.accessible,
      languages: data.languages,
      diagnostics: data.diagnostics,
    },
  });

  const withCounts = await prisma.clinic.findUniqueOrThrow({
    where: { id: data.clinicId },
    include: { _count: { select: { images: true, team: true } } },
  });
  const treatmentsCount = await prisma.clinicTreatment.count({ where: { clinicId: data.clinicId } });
  const completeness = computeProfileCompleteness({
    description: withCounts.description,
    tagline: withCounts.tagline,
    logoUrl: withCounts.logoUrl,
    coverUrl: withCounts.coverUrl,
    phone: withCounts.phone,
    website: withCounts.website,
    scheduleJson: withCounts.scheduleJson,
    languages: withCounts.languages,
    facilities: withCounts.facilities,
    treatmentsCount,
    teamCount: withCounts._count.team,
    imagesCount: withCounts._count.images,
  });
  await prisma.clinic.update({ where: { id: data.clinicId }, data: { profileCompleteness: completeness } });

  const ctx = await getClientContext();
  await recordAudit({
    action: "clinic.updated",
    entity: "Clinic",
    entityId: data.clinicId,
    actorId: user.id,
    actorEmail: user.email,
    metadata: { source: "dashboard.clinica" },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/clinica");
  return { ok: true, message: "Perfil actualizado correctamente." };
}

export async function saveClinicTreatments(
  user: SessionUser,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const clinicId = String(formData.get("clinicId") ?? "");
  if (!clinicId) return { ok: false, message: "Clínica no válida." };
  await assertClinicAccess(user, clinicId, { requireAdmin: true });

  const allTreatments = await prisma.treatment.findMany({ select: { id: true } });

  const ops = allTreatments.map(async (t) => {
    const enabled = formData.get(`t_${t.id}`) === "on";
    const priceRaw = String(formData.get(`p_${t.id}`) ?? "").trim();
    const priceEuros = priceRaw ? Number(priceRaw) : null;
    const priceFromCents = priceEuros && Number.isFinite(priceEuros) && priceEuros > 0 ? eurosToCents(priceEuros) : null;

    if (!enabled) {
      await prisma.clinicTreatment.deleteMany({ where: { clinicId, treatmentId: t.id } });
      return;
    }
    await prisma.clinicTreatment.upsert({
      where: { clinicId_treatmentId: { clinicId, treatmentId: t.id } },
      create: { clinicId, treatmentId: t.id, priceFromCents },
      update: { priceFromCents },
    });
  });
  await Promise.all(ops);

  const treatmentsCount = await prisma.clinicTreatment.count({ where: { clinicId } });
  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: clinicId },
    include: { _count: { select: { images: true, team: true } } },
  });
  const completeness = computeProfileCompleteness({
    description: clinic.description,
    tagline: clinic.tagline,
    logoUrl: clinic.logoUrl,
    coverUrl: clinic.coverUrl,
    phone: clinic.phone,
    website: clinic.website,
    scheduleJson: clinic.scheduleJson,
    languages: clinic.languages,
    facilities: clinic.facilities,
    treatmentsCount,
    teamCount: clinic._count.team,
    imagesCount: clinic._count.images,
  });
  await prisma.clinic.update({ where: { id: clinicId }, data: { profileCompleteness: completeness } });

  const ctx = await getClientContext();
  await recordAudit({
    action: "clinic.updated",
    entity: "Clinic",
    entityId: clinicId,
    actorId: user.id,
    actorEmail: user.email,
    metadata: { source: "dashboard.clinica.treatments" },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/clinica");
  return { ok: true, message: "Tratamientos y precios actualizados." };
}

/* ---------------------------------------------------------------------- */
/* Equipo e invitaciones                                                  */
/* ---------------------------------------------------------------------- */

export type TeamMemberRow = {
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  joinedAt: Date;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: OrgRole;
  expiresAt: Date;
};

export async function getTeamData(user: SessionUser, organizationId: string) {
  await assertOrgAccess(user, organizationId);

  const [members, invitations] = await Promise.all([
    prisma.organizationUser.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    // Nunca se selecciona `token`: aunque hoy TeamTable es un Server
    // Component y no cruza al cliente, el token de invitación no debe salir
    // de esta consulta como práctica de mínimo privilegio.
    prisma.invitation.findMany({
      where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, expiresAt: true },
    }),
  ]);

  const rows: TeamMemberRow[] = members.map((m) => ({
    userId: m.user.id,
    name: m.user.name ?? m.user.email,
    email: m.user.email,
    role: m.role,
    joinedAt: m.createdAt,
  }));

  return { members: rows, invitations };
}

export async function inviteTeamMember(
  user: SessionUser,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const organizationId = String(formData.get("organizationId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "CLINIC_USER") as OrgRole;

  if (!organizationId) return { ok: false, message: "Organización no válida." };
  await assertOrgAccess(user, organizationId, { requireAdmin: true });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Introduce un email válido." };
  }
  if (role !== "CLINIC_ADMIN" && role !== "CLINIC_USER") {
    return { ok: false, message: "Rol no válido." };
  }

  const existingMember = await prisma.organizationUser.findFirst({
    where: { organizationId, user: { email } },
  });
  if (existingMember) {
    return { ok: false, message: "Esa persona ya forma parte del equipo." };
  }

  const token = randomBytes(24).toString("hex");
  await prisma.invitation.create({
    data: {
      organizationId,
      email,
      role,
      token,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const ctx = await getClientContext();
  await recordAudit({
    action: "user.invited",
    entity: "Invitation",
    actorId: user.id,
    actorEmail: user.email,
    metadata: { organizationId, email, role },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/equipo");
  return { ok: true, message: `Invitación creada para ${email}. El envío de email todavía no está conectado: comparte el código manualmente.` };
}

/* ---------------------------------------------------------------------- */
/* Server Actions expuestas al cliente                                    */
/* Cada una resuelve la sesión en servidor con requireUser(); nunca se     */
/* confía en un identificador de usuario recibido del cliente.            */
/* ---------------------------------------------------------------------- */

export type ProfileFormState = { ok: boolean; message: string; fieldErrors?: Record<string, string> };

export async function updateClinicProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();
  return updateClinicProfile(user, formData);
}

export type SimpleFormState = { ok: boolean; message: string };

export async function saveClinicTreatmentsAction(
  _prev: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  const user = await requireUser();
  return saveClinicTreatments(user, formData);
}

export async function inviteTeamMemberAction(
  _prev: SimpleFormState,
  formData: FormData,
): Promise<SimpleFormState> {
  const user = await requireUser();
  return inviteTeamMember(user, formData);
}
