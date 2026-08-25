import { randomBytes } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, type SessionUser } from "@/lib/authz";
import { getClientContext } from "@/lib/request";
import { hashIp } from "@/lib/hash";
import { slugify } from "@/lib/utils";
import { isReservedSlug } from "@/lib/seo/urls";
import { eurosToCents } from "@/lib/money";
import { parseClinicsCsv, type CsvClinicRow } from "@/lib/csv-clinics";
import { recordAudit, type AuditAction } from "@/server/audit";
import { postLedgerEntry, isPrismaUniqueError } from "@/server/ledger";
import { computePositions, persistPositions } from "@/server/markets";
import { enrichFromWebsite, type WebsiteEnrichment } from "@/server/onboarding";

const PAGE_SIZE = 25;

/* ---------------------------------------------------------------------- */
/* Auditoría — envoltorios                                                */
/* ---------------------------------------------------------------------- */

/** Para acciones que encajan en el catálogo cerrado de `AuditAction`. */
async function auditAdmin(
  actor: SessionUser,
  action: AuditAction,
  entity: string,
  entityId: string | null,
  metadata: Record<string, unknown>,
) {
  const ctx = await getClientContext();
  await recordAudit({
    action,
    entity,
    entityId,
    actorId: actor.id,
    actorEmail: actor.email,
    metadata,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
}

/**
 * Para acciones propias del panel de administración que no tienen un
 * literal equivalente en `AuditAction` (p. ej. cambios de rol de usuario o
 * de parámetros de mercado). `AuditLog.action` es una columna de texto
 * libre en el esquema; este envoltorio escribe directamente para no forzar
 * una etiqueta que no describe bien lo ocurrido.
 */
async function auditAdminFree(
  actor: SessionUser,
  action: string,
  entity: string,
  entityId: string | null,
  metadata: Record<string, unknown>,
) {
  const ctx = await getClientContext();
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        actorId: actor.id,
        actorEmail: actor.email,
        metadata: metadata as object,
        ipHash: hashIp(ctx.ip),
        userAgent: ctx.userAgent?.slice(0, 400) ?? null,
      },
    });
  } catch {
    // La auditoría nunca debe romper la operación de negocio.
  }
}

export type AdminFormState = { ok: boolean; message?: string };

/* ========================================================================
 * 1. RESUMEN
 * ===================================================================== */

export type AdminPeriodDays = 7 | 30 | 90;

export function parseAdminPeriod(value?: string | null): AdminPeriodDays {
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

export async function getAdminOverview(days: AdminPeriodDays) {
  const since = daysAgo(days);

  const [gmv, recognized, activeClinics, marketsWithBids, clicks, leadsCount, billedLeads, payingClinics] =
    await Promise.all([
      prisma.walletTransaction.aggregate({
        where: { reason: "TOPUP", type: "CREDIT", createdAt: { gte: since } },
        _sum: { amountCents: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { type: "DEBIT", reason: { in: ["CLICK", "LEAD", "SPONSORSHIP"] }, createdAt: { gte: since } },
        _sum: { amountCents: true },
      }),
      prisma.clinic.count({ where: { status: "PUBLISHED" } }),
      prisma.bid.findMany({
        where: { status: "ACTIVE", amountCents: { gt: 0 } },
        select: { marketId: true },
        distinct: ["marketId"],
      }),
      prisma.click.count({ where: { valid: true, createdAt: { gte: since } } }),
      prisma.lead.count({ where: { createdAt: { gte: since } } }),
      prisma.lead.aggregate({
        where: { billed: true, createdAt: { gte: since } },
        _sum: { priceCents: true },
        _count: { _all: true },
      }),
      prisma.walletTransaction.findMany({
        where: { type: "DEBIT", createdAt: { gte: since } },
        select: { clinicId: true },
        distinct: ["clinicId"],
      }),
    ]);

  const recognizedTotal = Math.abs(recognized._sum.amountCents ?? 0);
  const arpaCents = payingClinics.length > 0 ? Math.round(recognizedTotal / payingClinics.length) : null;
  const cplCents = billedLeads._count._all > 0 ? Math.round((billedLeads._sum.priceCents ?? 0) / billedLeads._count._all) : null;

  return {
    period: days,
    gmvCents: gmv._sum.amountCents ?? 0,
    recognizedRevenueCents: recognizedTotal,
    activeClinics,
    marketsWithBids: marketsWithBids.length,
    clicks,
    leads: leadsCount,
    cplCents,
    arpaCents,
  };
}

/* ========================================================================
 * 2. CLÍNICAS
 * ===================================================================== */

const CLINIC_STATUSES = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "SUSPENDED"] as const;
const VERIFICATION_STATUSES = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const;

export type ClinicAdminFilters = { status?: string; verification?: string; q?: string; page: number };

export async function getClinicsPage(filters: ClinicAdminFilters) {
  const page = Math.max(1, filters.page);
  const where: Record<string, unknown> = {};
  if (filters.status && (CLINIC_STATUSES as readonly string[]).includes(filters.status)) where.status = filters.status;
  if (filters.verification && (VERIFICATION_STATUSES as readonly string[]).includes(filters.verification)) {
    where.verificationStatus = filters.verification;
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { name: { contains: q, mode: "insensitive" } } },
      { organization: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.clinic.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        verificationStatus: true,
        createdAt: true,
        city: { select: { name: true } },
        organization: { select: { name: true } },
        _count: { select: { bids: true } },
      },
    }),
    prisma.clinic.count({ where }),
  ]);

  return { rows, total, page, pageSize: PAGE_SIZE };
}

function verificationBlockers(
  clinic: { legalName: string | null; taxId: string | null; address: string },
  responsibleName: string | null,
): string[] {
  const blockers: string[] = [];
  if (!clinic.legalName?.trim()) blockers.push("falta la razón social");
  if (!clinic.taxId?.trim()) blockers.push("falta el CIF/NIF");
  if (!clinic.address?.trim()) blockers.push("falta la dirección");
  if (!responsibleName?.trim()) blockers.push("falta una persona responsable con nombre registrado");
  return blockers;
}

export async function getAdminClinicDetail(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      city: { select: { name: true, province: { select: { name: true } } } },
      organization: { select: { id: true, name: true, legalName: true, taxId: true, billingEmail: true } },
      wallet: true,
      treatments: { include: { treatment: { select: { name: true } } } },
      _count: { select: { leads: true, payments: true, bids: true } },
    },
  });
  if (!clinic) return null;

  const admins = await prisma.organizationUser.findMany({
    where: { organizationId: clinic.organizationId, role: "CLINIC_ADMIN" },
    include: { user: { select: { name: true, email: true } } },
  });
  const responsible = admins.find((a) => a.user.name?.trim()) ?? admins[0] ?? null;
  const blockers = verificationBlockers(clinic, responsible?.user.name ?? null);

  return { clinic, admins, responsible, blockers };
}

const clinicStatusSchema = z.object({ clinicId: z.string().min(1), status: z.enum(CLINIC_STATUSES) });

export async function changeClinicStatusAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = clinicStatusSchema.safeParse({
    clinicId: String(formData.get("clinicId") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Datos no válidos." };

  const clinic = await prisma.clinic.findUnique({
    where: { id: parsed.data.clinicId },
    select: { id: true, verificationStatus: true },
  });
  if (!clinic) return { ok: false, message: "La clínica ya no existe." };

  if (parsed.data.status === "PUBLISHED" && clinic.verificationStatus !== "VERIFIED") {
    return { ok: false, message: "No se puede publicar: la clínica todavía no está verificada." };
  }

  await prisma.clinic.update({
    where: { id: clinic.id },
    data: {
      status: parsed.data.status,
      publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : undefined,
    },
  });

  await auditAdmin(
    admin,
    parsed.data.status === "PUBLISHED" ? "clinic.published" : "clinic.updated",
    "Clinic",
    clinic.id,
    { status: parsed.data.status },
  );

  revalidatePath(`/admin/clinicas/${clinic.id}`);
  revalidatePath("/admin/clinicas");
  revalidatePath("/admin");
  return { ok: true, message: "Estado de la clínica actualizado." };
}

const verificationDecisionSchema = z.object({
  clinicId: z.string().min(1),
  decision: z.enum(["VERIFY", "REJECT", "RESET"]),
});

export async function changeClinicVerificationAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = verificationDecisionSchema.safeParse({
    clinicId: String(formData.get("clinicId") ?? ""),
    decision: String(formData.get("decision") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Datos no válidos." };

  const clinic = await prisma.clinic.findUnique({
    where: { id: parsed.data.clinicId },
    select: { id: true, legalName: true, taxId: true, address: true, organizationId: true },
  });
  if (!clinic) return { ok: false, message: "La clínica ya no existe." };

  if (parsed.data.decision === "VERIFY") {
    const admins = await prisma.organizationUser.findMany({
      where: { organizationId: clinic.organizationId, role: "CLINIC_ADMIN" },
      include: { user: { select: { name: true } } },
    });
    const responsibleName = admins.find((a) => a.user.name?.trim())?.user.name ?? null;
    const blockers = verificationBlockers(clinic, responsibleName);
    if (blockers.length > 0) {
      return { ok: false, message: `No se puede verificar: ${blockers.join(", ")}.` };
    }

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { verificationStatus: "VERIFIED", verifiedAt: new Date() },
    });
    await auditAdmin(admin, "clinic.verified", "Clinic", clinic.id, {});
  } else if (parsed.data.decision === "REJECT") {
    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { verificationStatus: "REJECTED", verifiedAt: null },
    });
    await auditAdmin(admin, "clinic.updated", "Clinic", clinic.id, { verification: "REJECTED" });
  } else {
    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { verificationStatus: "UNVERIFIED", verifiedAt: null },
    });
    await auditAdmin(admin, "clinic.updated", "Clinic", clinic.id, { verification: "UNVERIFIED" });
  }

  revalidatePath(`/admin/clinicas/${clinic.id}`);
  revalidatePath("/admin/clinicas");
  return { ok: true, message: "Verificación actualizada." };
}

/* --- Enriquecimiento manual desde la web (ver server/onboarding.ts) --- */

export type EnrichmentPreviewState = { ok: boolean; message?: string; data?: WebsiteEnrichment };

export async function previewEnrichmentAction(
  _prev: EnrichmentPreviewState,
  formData: FormData,
): Promise<EnrichmentPreviewState> {
  await requireSuperAdmin();

  const clinicId = String(formData.get("clinicId") ?? "");
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { website: true } });
  if (!clinic?.website) return { ok: false, message: "Esta clínica no tiene una web configurada." };

  try {
    const data = await enrichFromWebsite(clinic.website);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo leer la web de la clínica." };
  }
}

const applyEnrichmentSchema = z.object({
  clinicId: z.string().min(1),
  tagline: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  logoUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export async function applyEnrichmentAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = applyEnrichmentSchema.safeParse({
    clinicId: String(formData.get("clinicId") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    description: String(formData.get("description") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Revisa los datos del formulario." };

  const clinic = await prisma.clinic.findUnique({ where: { id: parsed.data.clinicId }, select: { id: true } });
  if (!clinic) return { ok: false, message: "La clínica ya no existe." };

  await prisma.clinic.update({
    where: { id: clinic.id },
    data: {
      ...(parsed.data.tagline ? { tagline: parsed.data.tagline } : {}),
      ...(parsed.data.description ? { description: parsed.data.description } : {}),
      ...(parsed.data.logoUrl ? { logoUrl: parsed.data.logoUrl } : {}),
    },
  });

  await auditAdmin(admin, "clinic.updated", "Clinic", clinic.id, { source: "website_enrichment" });

  revalidatePath(`/admin/clinicas/${clinic.id}`);
  return { ok: true, message: "Ficha actualizada con los datos revisados." };
}

/* ========================================================================
 * 3. ORGANIZACIONES
 * ===================================================================== */

export type OrgAdminFilters = { q?: string; page: number };

export async function getOrganizationsPage(filters: OrgAdminFilters) {
  const page = Math.max(1, filters.page);
  const where: Record<string, unknown> = {};
  if (filters.q?.trim()) where.name = { contains: filters.q.trim(), mode: "insensitive" };

  const [rows, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        legalName: true,
        taxId: true,
        billingEmail: true,
        createdAt: true,
        _count: { select: { clinics: true, members: true } },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  return { rows, total, page, pageSize: PAGE_SIZE };
}

/* ========================================================================
 * 4. MERCADOS
 * ===================================================================== */

const PRICING_MODELS = ["BALANCE", "CPC", "CPL"] as const;
const MARKET_STATUSES = ["ACTIVE", "PAUSED", "CLOSED"] as const;

export type MarketAdminFilters = { status?: string; q?: string; page: number };

export async function getMarketsPage(filters: MarketAdminFilters) {
  const page = Math.max(1, filters.page);
  const where: Record<string, unknown> = {};
  if (filters.status && (MARKET_STATUSES as readonly string[]).includes(filters.status)) where.status = filters.status;
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { treatment: { name: { contains: q, mode: "insensitive" } } },
      { city: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.auctionMarket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        pricingModel: true,
        minimumBidCents: true,
        bidIncrementCents: true,
        sponsoredSlots: true,
        createdAt: true,
        treatment: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
        _count: { select: { bids: true } },
      },
    }),
    prisma.auctionMarket.count({ where }),
  ]);

  return { rows, total, page, pageSize: PAGE_SIZE };
}

export async function getMarketFormOptions() {
  const [treatments, cities] = await Promise.all([
    prisma.treatment.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.city.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { treatments, cities };
}

const createMarketSchema = z.object({
  treatmentId: z.string().min(1),
  cityId: z.string().min(1),
  pricingModel: z.enum(PRICING_MODELS),
  minimumBidEuros: z.coerce.number().min(0).max(10000),
  bidIncrementEuros: z.coerce.number().min(0.5).max(5000),
  sponsoredSlots: z.coerce.number().int().min(1).max(10),
});

export async function createMarketAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = createMarketSchema.safeParse({
    treatmentId: String(formData.get("treatmentId") ?? ""),
    cityId: String(formData.get("cityId") ?? ""),
    pricingModel: String(formData.get("pricingModel") ?? ""),
    minimumBidEuros: formData.get("minimumBidEuros"),
    bidIncrementEuros: formData.get("bidIncrementEuros"),
    sponsoredSlots: formData.get("sponsoredSlots"),
  });
  if (!parsed.success) return { ok: false, message: "Revisa los datos del mercado." };

  try {
    const market = await prisma.auctionMarket.create({
      data: {
        treatmentId: parsed.data.treatmentId,
        cityId: parsed.data.cityId,
        pricingModel: parsed.data.pricingModel,
        minimumBidCents: eurosToCents(parsed.data.minimumBidEuros),
        bidIncrementCents: eurosToCents(parsed.data.bidIncrementEuros),
        sponsoredSlots: parsed.data.sponsoredSlots,
      },
    });
    await auditAdmin(admin, "market.created", "AuctionMarket", market.id, {
      treatmentId: parsed.data.treatmentId,
      cityId: parsed.data.cityId,
    });
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return { ok: false, message: "Ya existe un mercado para ese tratamiento y municipio." };
    }
    throw error;
  }

  revalidatePath("/admin/mercados");
  return { ok: true, message: "Mercado creado." };
}

const marketStatusSchema = z.object({ marketId: z.string().min(1), status: z.enum(MARKET_STATUSES) });

export async function changeMarketStatusAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = marketStatusSchema.safeParse({
    marketId: String(formData.get("marketId") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Datos no válidos." };

  await prisma.auctionMarket.update({ where: { id: parsed.data.marketId }, data: { status: parsed.data.status } });
  await auditAdminFree(
    admin,
    parsed.data.status === "ACTIVE" ? "market.reactivated" : "market.status_changed",
    "AuctionMarket",
    parsed.data.marketId,
    { status: parsed.data.status },
  );

  if (parsed.data.status === "ACTIVE") await persistPositions(parsed.data.marketId);

  revalidatePath("/admin/mercados");
  return { ok: true, message: "Estado del mercado actualizado." };
}

const marketParamsSchema = z.object({
  marketId: z.string().min(1),
  minimumBidEuros: z.coerce.number().min(0).max(10000),
  bidIncrementEuros: z.coerce.number().min(0.5).max(5000),
  sponsoredSlots: z.coerce.number().int().min(1).max(10),
  pricingModel: z.enum(PRICING_MODELS),
});

export async function updateMarketParamsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = marketParamsSchema.safeParse({
    marketId: String(formData.get("marketId") ?? ""),
    minimumBidEuros: formData.get("minimumBidEuros"),
    bidIncrementEuros: formData.get("bidIncrementEuros"),
    sponsoredSlots: formData.get("sponsoredSlots"),
    pricingModel: String(formData.get("pricingModel") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Revisa los datos del mercado." };

  await prisma.auctionMarket.update({
    where: { id: parsed.data.marketId },
    data: {
      minimumBidCents: eurosToCents(parsed.data.minimumBidEuros),
      bidIncrementCents: eurosToCents(parsed.data.bidIncrementEuros),
      sponsoredSlots: parsed.data.sponsoredSlots,
      pricingModel: parsed.data.pricingModel,
    },
  });

  await auditAdminFree(admin, "market.updated", "AuctionMarket", parsed.data.marketId, {
    minimumBidEuros: parsed.data.minimumBidEuros,
    bidIncrementEuros: parsed.data.bidIncrementEuros,
    sponsoredSlots: parsed.data.sponsoredSlots,
    pricingModel: parsed.data.pricingModel,
  });

  await persistPositions(parsed.data.marketId);

  revalidatePath("/admin/mercados");
  return { ok: true, message: "Parámetros del mercado actualizados." };
}

/* ========================================================================
 * 5. PUJAS
 * ===================================================================== */

const BID_STATUSES = ["ACTIVE", "PAUSED", "CANCELLED", "DEPLETED"] as const;

export type BidAdminFilters = { status?: string; q?: string; page: number };

export async function getBidsPage(filters: BidAdminFilters) {
  const page = Math.max(1, filters.page);
  const where: Record<string, unknown> = {};
  if (filters.status && (BID_STATUSES as readonly string[]).includes(filters.status)) where.status = filters.status;
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.clinic = { name: { contains: q, mode: "insensitive" } };
  }

  const [rows, total] = await Promise.all([
    prisma.bid.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        amountCents: true,
        maxCpcCents: true,
        cplCents: true,
        status: true,
        updatedAt: true,
        clinic: { select: { id: true, name: true } },
        market: {
          select: {
            id: true,
            sponsoredSlots: true,
            treatment: { select: { name: true } },
            city: { select: { name: true } },
          },
        },
      },
    }),
    prisma.bid.count({ where }),
  ]);

  const marketIds = [...new Set(rows.map((r) => r.market.id))];
  const positionEntries = await Promise.all(
    marketIds.map(async (id) => [id, await computePositions(id)] as const),
  );
  const positionsByMarket = new Map(positionEntries);

  const enriched = rows.map((b) => {
    const ranked = positionsByMarket.get(b.market.id) ?? [];
    const mine = ranked.find((r) => r.clinicId === b.clinic.id);
    return { ...b, position: mine?.position ?? null };
  });

  return { rows: enriched, total, page, pageSize: PAGE_SIZE };
}

/* ========================================================================
 * 6. LEADS (control de calidad global)
 * ===================================================================== */

const LEAD_QUALITIES = ["UNREVIEWED", "VALID", "INVALID", "DUPLICATE", "SPAM"] as const;
const LEAD_STATUSES = ["NEW", "CONTACTED", "APPOINTMENT", "ATTENDED", "BUDGET", "ACCEPTED", "LOST"] as const;

export type AdminLeadFilters = {
  quality?: string;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  page: number;
};

export async function getAdminLeadsPage(filters: AdminLeadFilters) {
  const page = Math.max(1, filters.page);
  const where: Record<string, unknown> = {};
  if (filters.quality && (LEAD_QUALITIES as readonly string[]).includes(filters.quality)) where.quality = filters.quality;
  if (filters.status && (LEAD_STATUSES as readonly string[]).includes(filters.status)) where.status = filters.status;
  if (filters.from || filters.to) {
    const createdAt: Record<string, Date> = {};
    if (filters.from) createdAt.gte = new Date(`${filters.from}T00:00:00`);
    if (filters.to) createdAt.lte = new Date(`${filters.to}T23:59:59`);
    where.createdAt = createdAt;
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
      { clinic: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        quality: true,
        billed: true,
        priceCents: true,
        createdAt: true,
        clinic: { select: { id: true, name: true } },
        treatment: { select: { name: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return { rows, total, page, pageSize: PAGE_SIZE };
}

const leadQualitySchema = z.object({
  leadId: z.string().min(1),
  quality: z.enum(["VALID", "INVALID", "DUPLICATE", "SPAM"]),
  note: z.string().trim().max(500).optional(),
  refund: z.boolean().optional(),
});

export async function reviewLeadQualityAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = leadQualitySchema.safeParse({
    leadId: String(formData.get("leadId") ?? ""),
    quality: String(formData.get("quality") ?? ""),
    note: String(formData.get("note") ?? "") || undefined,
    refund: formData.get("refund") === "on",
  });
  if (!parsed.success) return { ok: false, message: "Datos no válidos." };

  const lead = await prisma.lead.findUnique({
    where: { id: parsed.data.leadId },
    select: { id: true, clinicId: true, billed: true, priceCents: true },
  });
  if (!lead) return { ok: false, message: "El lead ya no existe." };

  await prisma.$transaction([
    prisma.lead.update({ where: { id: lead.id }, data: { quality: parsed.data.quality } }),
    prisma.leadEvent.create({
      data: {
        leadId: lead.id,
        type: "QUALITY_REVIEWED",
        message: parsed.data.note ?? parsed.data.quality,
        userId: admin.id,
      },
    }),
  ]);

  await auditAdmin(admin, "lead.quality_reviewed", "Lead", lead.id, { quality: parsed.data.quality });

  let refunded = false;
  const badQuality = parsed.data.quality !== "VALID";
  if (badQuality && parsed.data.refund && lead.billed && lead.priceCents > 0) {
    await postLedgerEntry({
      clinicId: lead.clinicId,
      type: "REFUND",
      reason: "LEAD",
      amountCents: lead.priceCents,
      reference: lead.id,
      idempotencyKey: `refund:lead:${lead.id}`,
      description: "Reembolso por lead de baja calidad",
    });
    await prisma.lead.update({ where: { id: lead.id }, data: { billed: false } });
    await auditAdmin(admin, "wallet.adjusted", "Lead", lead.id, { refundCents: lead.priceCents });
    refunded = true;
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin/fraude");
  return { ok: true, message: refunded ? "Calidad actualizada y reembolso emitido a la clínica." : "Calidad actualizada." };
}

/* ========================================================================
 * 7. PAGOS
 * ===================================================================== */

const PAYMENT_STATUSES = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;

export type PaymentAdminFilters = { status?: string; q?: string; page: number };

export function stripeDashboardUrl(paymentIntentId: string | null): string | null {
  if (!paymentIntentId) return null;
  const isTest = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
  return `https://dashboard.stripe.com/${isTest ? "test/" : ""}payments/${paymentIntentId}`;
}

export async function getPaymentsPage(filters: PaymentAdminFilters) {
  const page = Math.max(1, filters.page);
  const where: Record<string, unknown> = {};
  if (filters.status && (PAYMENT_STATUSES as readonly string[]).includes(filters.status)) where.status = filters.status;
  if (filters.q?.trim()) where.clinic = { name: { contains: filters.q.trim(), mode: "insensitive" } };

  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        amountCents: true,
        currency: true,
        status: true,
        provider: true,
        stripeSessionId: true,
        stripePaymentIntentId: true,
        failureReason: true,
        createdAt: true,
        clinic: { select: { id: true, name: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return { rows, total, page, pageSize: PAGE_SIZE };
}

/* ========================================================================
 * 8. USUARIOS
 * ===================================================================== */

export type UserAdminFilters = { q?: string; role?: string; active?: string; page: number };

export async function getUsersPage(filters: UserAdminFilters) {
  const page = Math.max(1, filters.page);
  const where: Record<string, unknown> = {};
  if (filters.role === "SUPER_ADMIN" || filters.role === "USER") where.role = filters.role;
  if (filters.active === "true") where.active = true;
  if (filters.active === "false") where.active = false;
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }];
  }

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { memberships: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { rows, total, page, pageSize: PAGE_SIZE };
}

const toggleUserSchema = z.object({ userId: z.string().min(1), active: z.boolean() });

export async function toggleUserActiveAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = toggleUserSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    active: formData.get("active") === "true",
  });
  if (!parsed.success) return { ok: false, message: "Datos no válidos." };

  if (parsed.data.userId === admin.id && !parsed.data.active) {
    return { ok: false, message: "No puedes desactivar tu propia cuenta." };
  }

  await prisma.user.update({ where: { id: parsed.data.userId }, data: { active: parsed.data.active } });
  await auditAdminFree(admin, "user.status_changed", "User", parsed.data.userId, { active: parsed.data.active });

  revalidatePath("/admin/usuarios");
  return { ok: true, message: parsed.data.active ? "Usuario activado." : "Usuario desactivado." };
}

const roleSchema = z.object({ userId: z.string().min(1), role: z.enum(["SUPER_ADMIN", "USER"]) });

export async function changeUserRoleAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = roleSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    role: String(formData.get("role") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Datos no válidos." };

  if (parsed.data.userId === admin.id && parsed.data.role !== "SUPER_ADMIN") {
    return { ok: false, message: "No puedes quitarte a ti mismo el rol de administrador." };
  }

  await prisma.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  await auditAdminFree(admin, "user.role_changed", "User", parsed.data.userId, { role: parsed.data.role });

  revalidatePath("/admin/usuarios");
  return { ok: true, message: "Rol actualizado." };
}

/* ========================================================================
 * 9. IMPORTACIÓN CSV
 * ===================================================================== */

// El analizador es lógica pura y vive en `@/lib/csv-clinics`; se reexporta
// aquí para no romper a quien ya lo importaba desde este módulo.
export { CSV_HEADERS, MAX_CSV_ROWS, parseClinicsCsv } from "@/lib/csv-clinics";
export type { CsvClinicRow } from "@/lib/csv-clinics";

export type CsvPreviewState = { ok: boolean; message?: string; rows: CsvClinicRow[] };

export async function previewCsvImportAction(_prev: CsvPreviewState, formData: FormData): Promise<CsvPreviewState> {
  await requireSuperAdmin();

  const csvText = String(formData.get("csv") ?? "");
  if (!csvText.trim()) return { ok: false, message: "Pega o sube un CSV.", rows: [] };
  if (csvText.length > 2_000_000) return { ok: false, message: "El CSV es demasiado grande (máx. ~2 MB).", rows: [] };

  const { rows, headerError } = parseClinicsCsv(csvText);
  if (headerError) return { ok: false, message: headerError, rows: [] };

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  return { ok: true, message: `${rows.length} filas analizadas · ${validCount} válidas.`, rows };
}

function uniqueLocalSlug(base: string): string {
  return `${slugify(base) || "item"}-${randomBytes(3).toString("hex")}`;
}

async function resolveOrCreateCity(cityName: string, provinceName: string, lat: number, lng: number, postalCode: string) {
  // Un municipio cuyo slug choque con un segmento estático de la aplicación
  // (por ejemplo "legal" o "dentistas") dejaría inalcanzable su propia página:
  // en Next.js la ruta estática siempre gana a la dinámica. Se le añade un
  // sufijo en lugar de crear una URL rota.
  const baseSlug = slugify(cityName);
  const citySlug = isReservedSlug(baseSlug) ? uniqueLocalSlug(cityName) : baseSlug;
  const existing = await prisma.city.findUnique({ where: { slug: citySlug } });
  if (existing) return existing;

  let province = await prisma.province.findFirst({
    where: { name: { equals: provinceName, mode: "insensitive" } },
  });
  if (!province) {
    let region = await prisma.region.findUnique({ where: { slug: "region-sin-clasificar" } });
    if (!region) {
      region = await prisma.region.create({ data: { name: "Región sin clasificar", slug: "region-sin-clasificar" } });
    }
    province = await prisma.province.create({
      data: { name: provinceName, slug: uniqueLocalSlug(provinceName), regionId: region.id },
    });
  }

  return prisma.city.create({
    data: { name: cityName, slug: citySlug, postalCode, lat, lng, provinceId: province.id },
  });
}

export type CsvImportState = { ok: boolean; message?: string; created: number; skipped: number; errors: string[] };

/**
 * Reimporta el CSV completo desde el texto crudo (nunca desde una
 * estructura ya "validada" que llegue del cliente): así ninguna fila se
 * crea sin volver a pasar por `parseClinicsCsv` en el servidor.
 */
export async function confirmCsvImportAction(_prev: CsvImportState, formData: FormData): Promise<CsvImportState> {
  const admin = await requireSuperAdmin();

  const csvText = String(formData.get("csv") ?? "");
  const { rows, headerError } = parseClinicsCsv(csvText);
  if (headerError) return { ok: false, message: headerError, created: 0, skipped: 0, errors: [] };

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.data) {
      skipped++;
      continue;
    }
    const d = row.data;
    try {
      const city = await resolveOrCreateCity(d.city, d.province, d.lat, d.lng, d.postalCode);

      await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: { name: d.name, slug: uniqueLocalSlug(d.name), phone: d.phone },
        });
        const clinic = await tx.clinic.create({
          data: {
            organizationId: organization.id,
            name: d.name,
            slug: uniqueLocalSlug(d.name),
            address: d.address,
            postalCode: d.postalCode,
            cityId: city.id,
            lat: d.lat,
            lng: d.lng,
            phone: d.phone,
            website: d.website,
            status: "DRAFT",
            verificationStatus: "UNVERIFIED",
          },
        });
        await tx.wallet.create({ data: { clinicId: clinic.id, balanceCents: 0 } });
      });
      created++;
    } catch (error) {
      skipped++;
      errors.push(`Fila ${row.rowNumber}: ${error instanceof Error ? error.message : "error desconocido"}`);
    }
  }

  await auditAdmin(admin, "import.clinics", "Clinic", null, { created, skipped, totalRows: rows.length });

  revalidatePath("/admin/clinicas");
  revalidatePath("/admin/organizaciones");

  return {
    ok: true,
    message: `Importación completada: ${created} clínicas creadas, ${skipped} filas omitidas.`,
    created,
    skipped,
    errors,
  };
}

/* ========================================================================
 * 10. FRAUDE
 * ===================================================================== */

export type FraudSignals = {
  duplicateLeads: { clinicId: string; clinicName: string; phone: string; count: number }[];
  invalidPhoneLeads: { id: string; clinicName: string; phone: string; createdAt: Date }[];
  ipBursts: { ipHash: string; count: number; clinicNames: string[]; since: Date }[];
  invalidClicks: { id: string; clinicName: string; createdAt: Date; invalidReason: string | null }[];
  anomalousClinics: { clinicId: string; clinicName: string; totalLeads: number; badLeads: number; ratio: number }[];
};

export async function getFraudSignals(): Promise<FraudSignals> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since60d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [recentLeads, invalidClicksRaw, leadsForRatio] = await Promise.all([
    prisma.lead.findMany({
      where: { createdAt: { gte: since24h } },
      select: { id: true, clinicId: true, phone: true, ipHash: true, createdAt: true, clinic: { select: { name: true } } },
    }),
    prisma.click.findMany({
      where: { valid: false, createdAt: { gte: since24h } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, createdAt: true, invalidReason: true, clinic: { select: { name: true } } },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: since60d }, quality: { not: "UNREVIEWED" } },
      select: { clinicId: true, quality: true, clinic: { select: { name: true } } },
    }),
  ]);

  const dupMap = new Map<string, { clinicId: string; clinicName: string; phone: string; count: number }>();
  const ipMap = new Map<string, { count: number; clinicNames: Set<string>; since: Date }>();
  for (const l of recentLeads) {
    const key = `${l.clinicId}|${l.phone}`;
    const dupBucket = dupMap.get(key) ?? { clinicId: l.clinicId, clinicName: l.clinic.name, phone: l.phone, count: 0 };
    dupBucket.count++;
    dupMap.set(key, dupBucket);

    if (l.ipHash) {
      const ipBucket = ipMap.get(l.ipHash) ?? { count: 0, clinicNames: new Set<string>(), since: l.createdAt };
      ipBucket.count++;
      ipBucket.clinicNames.add(l.clinic.name);
      if (l.createdAt < ipBucket.since) ipBucket.since = l.createdAt;
      ipMap.set(l.ipHash, ipBucket);
    }
  }

  const duplicateLeads = [...dupMap.values()].filter((v) => v.count > 1);
  const invalidPhoneLeads = recentLeads
    .filter((l) => !/^[6789]\d{8}$/.test(l.phone))
    .map((l) => ({ id: l.id, clinicName: l.clinic.name, phone: l.phone, createdAt: l.createdAt }));
  const ipBursts = [...ipMap.entries()]
    .filter(([, v]) => v.count >= 4)
    .map(([ipHash, v]) => ({ ipHash, count: v.count, clinicNames: [...v.clinicNames], since: v.since }));
  const invalidClicks = invalidClicksRaw.map((c) => ({
    id: c.id,
    clinicName: c.clinic.name,
    createdAt: c.createdAt,
    invalidReason: c.invalidReason,
  }));

  const ratioMap = new Map<string, { clinicName: string; total: number; bad: number }>();
  for (const l of leadsForRatio) {
    const bucket = ratioMap.get(l.clinicId) ?? { clinicName: l.clinic.name, total: 0, bad: 0 };
    bucket.total++;
    if (l.quality === "INVALID" || l.quality === "SPAM" || l.quality === "DUPLICATE") bucket.bad++;
    ratioMap.set(l.clinicId, bucket);
  }
  const anomalousClinics = [...ratioMap.entries()]
    .filter(([, v]) => v.total >= 10 && v.bad / v.total >= 0.4)
    .map(([clinicId, v]) => ({
      clinicId,
      clinicName: v.clinicName,
      totalLeads: v.total,
      badLeads: v.bad,
      ratio: Math.round((v.bad / v.total) * 100),
    }));

  return { duplicateLeads, invalidPhoneLeads, ipBursts, invalidClicks, anomalousClinics };
}

const ipBurstSchema = z.object({ ipHash: z.string().min(1) });

export async function markIpBurstAsSpamAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = ipBurstSchema.safeParse({ ipHash: String(formData.get("ipHash") ?? "") });
  if (!parsed.success) return { ok: false, message: "Datos no válidos." };

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const leads = await prisma.lead.findMany({
    where: { ipHash: parsed.data.ipHash, createdAt: { gte: since24h }, quality: { in: ["UNREVIEWED", "VALID"] } },
    select: { id: true },
  });
  if (leads.length === 0) return { ok: false, message: "No hay leads pendientes de revisar para esa IP." };

  await prisma.$transaction([
    prisma.lead.updateMany({ where: { id: { in: leads.map((l) => l.id) } }, data: { quality: "SPAM" } }),
    prisma.leadEvent.createMany({
      data: leads.map((l) => ({
        leadId: l.id,
        type: "QUALITY_REVIEWED",
        message: "Ráfaga sospechosa desde la misma IP",
        userId: admin.id,
      })),
    }),
  ]);

  await auditAdminFree(admin, "fraud.ip_burst_marked_spam", "Lead", null, { ipHash: parsed.data.ipHash, count: leads.length });

  revalidatePath("/admin/fraude");
  revalidatePath("/admin/leads");
  return { ok: true, message: `${leads.length} leads marcados como spam.` };
}

const dupBucketSchema = z.object({ clinicId: z.string().min(1), phone: z.string().min(1) });

export async function markDuplicateBucketAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const admin = await requireSuperAdmin();

  const parsed = dupBucketSchema.safeParse({
    clinicId: String(formData.get("clinicId") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Datos no válidos." };

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const leads = await prisma.lead.findMany({
    where: { clinicId: parsed.data.clinicId, phone: parsed.data.phone, createdAt: { gte: since24h } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (leads.length <= 1) return { ok: false, message: "No hay duplicados para marcar." };

  const original = leads[0];
  const toMark = leads.slice(1);

  await prisma.$transaction([
    prisma.lead.updateMany({
      where: { id: { in: toMark.map((l) => l.id) } },
      data: { quality: "DUPLICATE", duplicateOfId: original.id },
    }),
    prisma.leadEvent.createMany({
      data: toMark.map((l) => ({
        leadId: l.id,
        type: "QUALITY_REVIEWED",
        message: "Duplicado detectado automáticamente",
        userId: admin.id,
      })),
    }),
  ]);

  await auditAdminFree(admin, "fraud.duplicates_marked", "Lead", null, {
    clinicId: parsed.data.clinicId,
    phone: parsed.data.phone,
    count: toMark.length,
  });

  revalidatePath("/admin/fraude");
  revalidatePath("/admin/leads");
  return { ok: true, message: `${toMark.length} leads marcados como duplicados.` };
}

/* ========================================================================
 * 11. AUDITORÍA
 * ===================================================================== */

export type AuditAdminFilters = { action?: string; entity?: string; from?: string; to?: string; page: number };

export async function getAuditLogPage(filters: AuditAdminFilters) {
  const page = Math.max(1, filters.page);
  const where: Record<string, unknown> = {};
  if (filters.action?.trim()) where.action = filters.action.trim();
  if (filters.entity?.trim()) where.entity = filters.entity.trim();
  if (filters.from || filters.to) {
    const createdAt: Record<string, Date> = {};
    if (filters.from) createdAt.gte = new Date(`${filters.from}T00:00:00`);
    if (filters.to) createdAt.lte = new Date(`${filters.to}T23:59:59`);
    where.createdAt = createdAt;
  }

  const [rows, total, actions, entities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" }, take: 200 }),
    prisma.auditLog.findMany({ distinct: ["entity"], select: { entity: true }, orderBy: { entity: "asc" }, take: 200 }),
  ]);

  return {
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    actionOptions: actions.map((a) => a.action),
    entityOptions: entities.map((e) => e.entity),
  };
}
