import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registerClick } from "@/server/clicks";
import { clientContextFromRequest } from "@/lib/request";
import { isSafeExternalUrl } from "@/lib/validation";
import { appUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  c: z.string().min(1), // clinicId
  t: z.enum(["PROFILE", "PHONE", "WHATSAPP", "WEBSITE", "DIRECTIONS", "LEAD_FORM_OPEN"]),
  to: z.string().optional(), // pista informativa; el destino real se recalcula desde la BD
  m: z.string().optional(), // marketId
  tr: z.string().optional(), // treatmentId
  ci: z.string().optional(), // cityId
  p: z.coerce.number().int().positive().optional(), // position
  s: z.string().optional(), // sponsored
});

/**
 * Redirección con tracking de clics.
 *
 * Regla de seguridad: el destino de la redirección NUNCA se construye a
 * partir del parámetro "to" (no confiable). Siempre se recalcula en
 * servidor a partir de los datos propios de la clínica en base de datos.
 */
export async function GET(request: NextRequest) {
  const base = appUrl();
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/", base), 307);
  }

  const { c: clinicId, t: type, m: marketId, tr: treatmentId, ci: cityId, p: position, s } = parsed.data;
  const sponsored = s === "1";

  const clinic = await prisma.clinic.findFirst({
    where: { id: clinicId, status: "PUBLISHED" },
    select: { slug: true, phone: true, whatsapp: true, website: true, lat: true, lng: true },
  });

  if (!clinic) {
    return NextResponse.redirect(new URL("/", base), 307);
  }

  let target = new URL(`/clinica/${clinic.slug}`, base).toString();

  switch (type) {
    case "PROFILE":
    case "LEAD_FORM_OPEN":
      target = new URL(`/clinica/${clinic.slug}`, base).toString();
      break;
    case "DIRECTIONS":
      target = `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`;
      break;
    case "PHONE":
      target = `tel:${sanitizeTelDigits(clinic.phone)}`;
      break;
    case "WHATSAPP":
      target = clinic.whatsapp
        ? `https://wa.me/${sanitizeTelDigits(clinic.whatsapp)}`
        : `tel:${sanitizeTelDigits(clinic.phone)}`;
      break;
    case "WEBSITE":
      target =
        clinic.website && isSafeExternalUrl(clinic.website)
          ? clinic.website
          : new URL(`/clinica/${clinic.slug}`, base).toString();
      break;
  }

  const ctx = clientContextFromRequest(request);

  try {
    await registerClick({
      clinicId,
      type,
      marketId: marketId ?? null,
      treatmentId: treatmentId ?? null,
      cityId: cityId ?? null,
      position: position ?? null,
      sponsored,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      referrer: ctx.referrer,
    });
  } catch {
    // El clic no debe bloquear la redirección aunque falle el registro.
  }

  return NextResponse.redirect(target, 307);
}

function sanitizeTelDigits(raw: string): string {
  // Conserva un "+" inicial si existe, y solo dígitos después.
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}
