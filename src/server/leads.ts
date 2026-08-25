"use server";

import { prisma } from "@/lib/prisma";
import { leadFormSchema } from "@/lib/validation";
import { getClientContext } from "@/lib/request";
import { hashIp, normalizeEmail, normalizePhone } from "@/lib/hash";
import { rateLimit } from "@/lib/rate-limit";
import { CONSENT_TEXTS, CONSENT_VERSION } from "@/lib/consent";
import { recordAudit } from "@/server/audit";
import { postLedgerEntry } from "@/server/ledger";
import { revalidatePath } from "next/cache";

export type LeadActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  leadId?: string;
};

/**
 * Alta de un lead desde el formulario público.
 *
 * - Doble consentimiento separado (envío a la clínica / comunicaciones comerciales).
 * - Se guarda versión, momento y origen de cada consentimiento.
 * - No se solicitan ni almacenan datos de salud.
 */
export async function submitLead(
  _prev: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  const raw = {
    clinicId: String(formData.get("clinicId") ?? ""),
    treatmentId: (formData.get("treatmentId") as string) || null,
    cityId: (formData.get("cityId") as string) || null,
    marketId: (formData.get("marketId") as string) || null,
    source: (formData.get("source") as string) || "SEARCH_RESULTS",
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    timePreference: (formData.get("timePreference") as string) || "ANY",
    comment: String(formData.get("comment") ?? ""),
    consentDataSharing: formData.get("consentDataSharing") === "on",
    consentMarketing: formData.get("consentMarketing") === "on",
    website: String(formData.get("website") ?? ""),
  };

  const parsed = leadFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors };
  }

  const data = parsed.data;
  const ctx = await getClientContext();

  const limit = await rateLimit("lead", ctx.ip ?? "anon", 5, 60 * 15);
  if (!limit.ok) {
    return {
      ok: false,
      message: "Has enviado demasiadas solicitudes. Inténtalo de nuevo en unos minutos.",
    };
  }

  const clinic = await prisma.clinic.findFirst({
    where: { id: data.clinicId, status: "PUBLISHED" },
    select: { id: true, cityId: true, name: true },
  });
  if (!clinic) {
    return { ok: false, message: "La clínica seleccionada ya no está disponible." };
  }

  const phone = normalizePhone(data.phone);
  const email = normalizeEmail(data.email);

  // Detección de duplicado: mismo teléfono y misma clínica en las últimas 24 h.
  const duplicate = await prisma.lead.findFirst({
    where: {
      clinicId: clinic.id,
      phone,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
  });

  const priceCents = data.marketId
    ? ((
        await prisma.bid.findFirst({
          where: { marketId: data.marketId, clinicId: clinic.id, status: "ACTIVE" },
          select: { cplCents: true },
        })
      )?.cplCents ?? 0)
    : 0;

  const lead = await prisma.lead.create({
    data: {
      clinicId: clinic.id,
      marketId: data.marketId,
      treatmentId: data.treatmentId,
      cityId: data.cityId ?? clinic.cityId,
      name: data.name,
      phone,
      email,
      postalCode: data.postalCode || null,
      timePreference: data.timePreference,
      comment: data.comment || null,
      source: data.source,
      quality: duplicate ? "DUPLICATE" : "UNREVIEWED",
      duplicateOfId: duplicate?.id ?? null,
      priceCents: duplicate ? 0 : priceCents,
      ipHash: hashIp(ctx.ip),
      userAgent: ctx.userAgent?.slice(0, 400) ?? null,
      referrer: ctx.referrer?.slice(0, 400) ?? null,
      events: { create: { type: "CREATED", toStatus: "NEW" } },
      consents: {
        create: [
          {
            type: "DATA_SHARING",
            granted: true,
            version: CONSENT_VERSION,
            text: CONSENT_TEXTS.DATA_SHARING,
            source: data.source,
            ipHash: hashIp(ctx.ip),
            userAgent: ctx.userAgent?.slice(0, 400) ?? null,
          },
          {
            type: "MARKETING",
            granted: Boolean(data.consentMarketing),
            version: CONSENT_VERSION,
            text: CONSENT_TEXTS.MARKETING,
            source: data.source,
            ipHash: hashIp(ctx.ip),
            userAgent: ctx.userAgent?.slice(0, 400) ?? null,
          },
        ],
      },
    },
    select: { id: true },
  });

  // Modelo C (CPL): solo se cobra un lead no duplicado y con precio configurado.
  if (!duplicate && priceCents > 0) {
    try {
      await postLedgerEntry(
        {
          clinicId: clinic.id,
          type: "DEBIT",
          reason: "LEAD",
          amountCents: priceCents,
          reference: lead.id,
          idempotencyKey: `lead:${lead.id}`,
          description: "Lead válido recibido",
        },
        { allowNegative: true },
      );
      await prisma.lead.update({ where: { id: lead.id }, data: { billed: true } });
    } catch {
      // Si el cobro falla, el lead se entrega igualmente y queda pendiente de facturar.
    }
  }

  await recordAudit({
    action: "lead.created",
    entity: "Lead",
    entityId: lead.id,
    metadata: { clinicId: clinic.id, source: data.source },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/leads");

  return {
    ok: true,
    leadId: lead.id,
    message: `Solicitud enviada a ${clinic.name}. Te contactarán en breve.`,
  };
}
