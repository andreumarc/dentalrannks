import { z } from "zod";

/** Teléfono español: fijo o móvil, con o sin prefijo internacional. */
export const phoneSchema = z
  .string()
  .trim()
  .min(9, "Introduce un teléfono válido")
  .max(20)
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    const local = digits.startsWith("34") && digits.length === 11 ? digits.slice(2) : digits;
    return /^[6789]\d{8}$/.test(local);
  }, "Introduce un teléfono español válido");

export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "El código postal debe tener 5 dígitos");

/**
 * Formulario público de solicitud de valoración.
 * No se piden datos clínicos ni categorías especiales de datos (art. 9 GDPR):
 * solo lo imprescindible para que la clínica pueda devolver la llamada.
 */
export const leadFormSchema = z.object({
  clinicId: z.string().min(1),
  treatmentId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  marketId: z.string().optional().nullable(),
  source: z
    .enum(["SEARCH_RESULTS", "CLINIC_PROFILE", "CITY_PAGE", "HOMEPAGE", "DIRECT"])
    .default("SEARCH_RESULTS"),
  name: z.string().trim().min(2, "Indica tu nombre").max(120),
  phone: phoneSchema,
  email: z.string().trim().toLowerCase().email("Introduce un email válido").max(160),
  postalCode: postalCodeSchema.optional().or(z.literal("")),
  timePreference: z.enum(["MORNING", "AFTERNOON", "ANY"]).default("ANY"),
  comment: z.string().trim().max(600, "Máximo 600 caracteres").optional().or(z.literal("")),
  consentDataSharing: z
    .boolean()
    .refine((v) => v === true, "Necesitamos tu consentimiento para enviar la solicitud"),
  consentMarketing: z.boolean().default(false),
  // Campo trampa contra bots. Debe llegar vacío.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type LeadFormValues = z.input<typeof leadFormSchema>;

export const bidSchema = z.object({
  marketId: z.string().min(1),
  clinicId: z.string().min(1),
  amountEuros: z.coerce
    .number()
    .min(0, "El importe no puede ser negativo")
    .max(100000, "Importe demasiado alto"),
});

export const topUpSchema = z.object({
  clinicId: z.string().min(1),
  amountEuros: z.coerce
    .number()
    .int("Introduce un importe entero en euros")
    .min(50, "La recarga mínima es de 50 €")
    .max(20000, "Para importes superiores contacta con nosotros"),
});

export const leadStatusSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum([
    "NEW",
    "CONTACTED",
    "APPOINTMENT",
    "ATTENDED",
    "BUDGET",
    "ACCEPTED",
    "LOST",
  ]),
  note: z.string().trim().max(500).optional(),
});

export const clinicProfileSchema = z.object({
  clinicId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  tagline: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  phone: phoneSchema,
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email().max(160).optional().or(z.literal("")),
  website: z.string().trim().url("Introduce una URL válida").max(200).optional().or(z.literal("")),
  address: z.string().trim().min(4).max(200),
  postalCode: postalCodeSchema,
  firstVisitFree: z.boolean().default(false),
  financing: z.boolean().default(false),
  emergency24h: z.boolean().default(false),
  parking: z.boolean().default(false),
  accessible: z.boolean().default(false),
  languages: z.array(z.string().max(40)).max(10).default([]),
  diagnostics: z.array(z.string().max(60)).max(12).default([]),
});

export const clinicSignupSchema = z.object({
  clinicName: z.string().trim().min(2, "Indica el nombre de la clínica").max(160),
  contactName: z.string().trim().min(2, "Indica tu nombre").max(120),
  email: z.string().trim().toLowerCase().email("Introduce un email válido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(200)
    .regex(/[a-zA-Z]/, "Debe incluir alguna letra")
    .regex(/\d/, "Debe incluir algún número"),
  phone: phoneSchema,
  website: z.string().trim().url("Introduce una URL válida").optional().or(z.literal("")),
  address: z.string().trim().min(4).max(200),
  postalCode: postalCodeSchema,
  citySlug: z.string().min(1, "Selecciona un municipio"),
  treatmentIds: z.array(z.string()).min(1, "Selecciona al menos un tratamiento"),
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, "Debes aceptar las condiciones del servicio"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Introduce un email válido"),
  password: z.string().min(1, "Introduce tu contraseña"),
});

function isPrivateOrReservedIpv4(host: string): boolean {
  return (
    host === "0.0.0.0" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

/** Reconstruye el IPv4 de 32 bits codificado en dos grupos hexadecimales de un IPv6. */
function hexGroupsToIpv4(hi: string, lo: string): string {
  const a = hi.padStart(4, "0");
  const b = lo.padStart(4, "0");
  return [a.slice(0, 2), a.slice(2, 4), b.slice(0, 2), b.slice(2, 4)]
    .map((h) => parseInt(h, 16))
    .join(".");
}

/**
 * Bloquea direcciones IPv6 que apuntan a destinos internos, incluyendo las
 * formas que representan (o incrustan) una IPv4 privada: `new URL()` siempre
 * normaliza los literales IPv6 a su forma comprimida en minúsculas, así que
 * comparar contra esa forma canónica es suficiente — no hace falta un parser
 * de IPv6 completo.
 */
function isBlockedIpv6(bracketed: string): boolean {
  const host = bracketed.slice(1, -1).toLowerCase();
  if (host === "::1" || host === "::") return true;
  if (/^fe[89ab][0-9a-f]:/.test(host)) return true; // link-local, fe80::/10
  if (/^f[cd][0-9a-f]{2}:/.test(host)) return true; // unique-local, fc00::/7

  // Direcciones IPv4 incrustadas: mapeadas ("::ffff:h:h"), NAT64
  // ("64:ff9b::h:h") o la forma "compatible" en desuso ("::h:h"). En los
  // tres casos los dos últimos grupos hexadecimales codifican el IPv4.
  const embedded = /^(?:::ffff:|64:ff9b::|::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(host);
  if (embedded && isPrivateOrReservedIpv4(hexGroupsToIpv4(embedded[1], embedded[2]))) {
    return true;
  }
  return false;
}

/** Validación de una URL externa antes de solicitarla (prevención de SSRF). */
export function isSafeExternalUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase();

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    return false;
  }

  // Un hostname IPv6 literal siempre llega entre corchetes (p. ej. "[::1]");
  // el resto son nombres de dominio o literales IPv4.
  if (host.startsWith("[") && host.endsWith("]")) {
    return !isBlockedIpv6(host);
  }

  return !isPrivateOrReservedIpv4(host);
}
