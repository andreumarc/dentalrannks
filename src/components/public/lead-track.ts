"use server";

import { registerClick } from "@/server/clicks";
import { getClientContext } from "@/lib/request";

/**
 * Registra la apertura del formulario de valoración como un clic más
 * (sin redirección: la apertura es una interacción en la misma página).
 * Falla en silencio: nunca debe bloquear al usuario que quiere pedir cita.
 */
export async function trackLeadFormOpen(params: {
  clinicId: string;
  marketId?: string | null;
  treatmentId?: string | null;
  cityId?: string | null;
  position?: number | null;
  sponsored?: boolean;
}) {
  try {
    const ctx = await getClientContext();
    await registerClick({
      clinicId: params.clinicId,
      type: "LEAD_FORM_OPEN",
      marketId: params.marketId ?? null,
      treatmentId: params.treatmentId ?? null,
      cityId: params.cityId ?? null,
      position: params.position ?? null,
      sponsored: params.sponsored,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      referrer: ctx.referrer,
    });
  } catch {
    // No interrumpir la experiencia del usuario si falla el tracking.
  }
}
