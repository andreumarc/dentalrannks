import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { loginSchema, clinicSignupSchema, isSafeExternalUrl } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { getClientContext } from "@/lib/request";
import { slugify } from "@/lib/utils";
import { recordAudit } from "@/server/audit";
import { ensureMarket } from "@/server/markets";
import { isPrismaUniqueError } from "@/server/ledger";

/* ---------------------------------------------------------------------- */
/* Datos de apoyo para el formulario de alta (lectura)                    */
/* ---------------------------------------------------------------------- */

export const getSignupCities = cache(async () =>
  prisma.city.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      province: { select: { name: true } },
    },
  }),
);

export const getSignupTreatments = cache(async () =>
  prisma.treatment.findMany({
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: { select: { id: true, name: true } },
    },
  }),
);

/* ---------------------------------------------------------------------- */
/* Login                                                                  */
/* ---------------------------------------------------------------------- */

export type AuthActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

/** Evita redirecciones abiertas: solo se acepta una ruta interna tras el login. */
function safeCallback(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function loginAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {

  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors };
  }

  const ctx = await getClientContext();
  const limit = await rateLimit("login", ctx.ip ?? "anon", 8, 60 * 10);
  if (!limit.ok) {
    return {
      ok: false,
      message: `Demasiados intentos desde esta conexión. Prueba de nuevo en ${Math.max(1, Math.ceil(limit.retryAfterSeconds / 60))} min.`,
    };
  }

  const callbackUrl = safeCallback(String(formData.get("callbackUrl") ?? ""));

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Email o contraseña incorrectos." };
    }
    // NEXT_REDIRECT y otros controles internos de Next deben propagarse.
    throw error;
  }

  return { ok: true };
}

/* ---------------------------------------------------------------------- */
/* Alta de clínica                                                        */
/* ---------------------------------------------------------------------- */

export type SignupActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

function uniqueSlug(base: string): string {
  const root = slugify(base) || "clinica";
  return `${root}-${randomBytes(3).toString("hex")}`;
}

/**
 * Alta de clínica en un único formulario. En una transacción crea el usuario
 * (admin de la organización), la organización, la clínica (en DRAFT,
 * pendiente de revisión), su wallet, su presupuesto y sus tratamientos, y
 * asegura el mercado (tratamiento×municipio) para cada tratamiento elegido.
 *
 * La extracción de logo/descripción desde la web de la clínica NO ocurre
 * aquí: ver `enrichFromWebsite`, que se ejecuta manualmente desde /admin.
 */
export async function signupClinicAction(
  _prev: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {

  const raw = {
    clinicName: String(formData.get("clinicName") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    website: String(formData.get("website") ?? ""),
    address: String(formData.get("address") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    citySlug: String(formData.get("citySlug") ?? ""),
    treatmentIds: formData.getAll("treatmentIds").map(String).filter(Boolean),
    acceptTerms: formData.get("acceptTerms") === "on",
  };

  const parsed = clinicSignupSchema.safeParse(raw);
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
  const limit = await rateLimit("signup", ctx.ip ?? "anon", 5, 60 * 30);
  if (!limit.ok) {
    return { ok: false, message: "Demasiados intentos de alta desde esta conexión. Inténtalo más tarde." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existingUser) {
    return {
      ok: false,
      message: "Ya existe una cuenta con ese email.",
      fieldErrors: { email: "Ya existe una cuenta con ese email." },
    };
  }

  const city = await prisma.city.findUnique({ where: { slug: data.citySlug } });
  if (!city) {
    return {
      ok: false,
      message: "Selecciona un municipio válido de la lista.",
      fieldErrors: { citySlug: "Municipio no válido." },
    };
  }

  const treatments = await prisma.treatment.findMany({
    where: { id: { in: data.treatmentIds } },
    select: { id: true },
  });
  if (treatments.length === 0) {
    return {
      ok: false,
      message: "Selecciona al menos un tratamiento que ofrezca la clínica.",
      fieldErrors: { treatmentIds: "Selecciona al menos un tratamiento." },
    };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  let created: { userId: string; organizationId: string; clinicId: string };
  try {
    created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.contactName,
          email: data.email,
          passwordHash,
          role: "USER",
          phone: data.phone,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: data.clinicName,
          slug: uniqueSlug(data.clinicName),
          billingEmail: data.email,
          phone: data.phone,
        },
      });

      await tx.organizationUser.create({
        data: { organizationId: organization.id, userId: user.id, role: "CLINIC_ADMIN" },
      });

      const clinic = await tx.clinic.create({
        data: {
          organizationId: organization.id,
          name: data.clinicName,
          slug: uniqueSlug(data.clinicName),
          address: data.address,
          postalCode: data.postalCode,
          cityId: city.id,
          lat: city.lat,
          lng: city.lng,
          phone: data.phone,
          email: data.email,
          website: data.website || null,
          status: "DRAFT",
          verificationStatus: "UNVERIFIED",
        },
      });

      await tx.wallet.create({ data: { clinicId: clinic.id, balanceCents: 0 } });
      await tx.clinicBudget.create({ data: { clinicId: clinic.id, defaultModel: "BALANCE" } });

      await tx.clinicTreatment.createMany({
        data: treatments.map((t) => ({ clinicId: clinic.id, treatmentId: t.id })),
        skipDuplicates: true,
      });

      return { userId: user.id, organizationId: organization.id, clinicId: clinic.id };
    });
  } catch (error) {
    if (isPrismaUniqueError(error)) {
      return { ok: false, message: "Ya existe una cuenta o clínica con esos datos. Inténtalo de nuevo." };
    }
    throw error;
  }

  // Fuera de la transacción: crear/asegurar los mercados. Es idempotente
  // (upsert por treatmentId+cityId) y no forma parte de la atomicidad del alta.
  await Promise.all(treatments.map((t) => ensureMarket(t.id, city.id)));

  await recordAudit({
    action: "organization.created",
    entity: "Organization",
    entityId: created.organizationId,
    actorId: created.userId,
    actorEmail: data.email,
    metadata: { clinicName: data.clinicName },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  await recordAudit({
    action: "clinic.created",
    entity: "Clinic",
    entityId: created.clinicId,
    actorId: created.userId,
    actorEmail: data.email,
    metadata: { citySlug: data.citySlug, treatmentCount: treatments.length },
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // La cuenta se creó correctamente; si el login automático falla por
      // cualquier motivo, el usuario puede entrar a mano desde /login.
      return { ok: true, message: "Clínica dada de alta. Inicia sesión para continuar." };
    }
    throw error;
  }

  return { ok: true };
}

/* ---------------------------------------------------------------------- */
/* Enriquecimiento manual desde la web de la clínica (solo /admin)        */
/* ---------------------------------------------------------------------- */

export type WebsiteEnrichment = {
  title: string | null;
  description: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
};

const ENRICH_TIMEOUT_MS = 6000;
const ENRICH_MAX_BYTES = 800_000; // 800 KB de HTML como máximo, para no descargar sitios enteros

/**
 * Extrae metadatos básicos (título, descripción, logo, favicon) de la web
 * pública de una clínica.
 *
 * IMPORTANTE: esta función se ejecuta MANUALMENTE desde /admin (botón
 * "Enriquecer desde la web" en la ficha de la clínica) — nunca durante el
 * alta pública ni de forma automática o programada. Todo lo que devuelve es
 * una SUGERENCIA: el equipo de admin debe revisarla y puede editar cualquier
 * campo a mano antes de guardarlo en la ficha (ver `previewEnrichmentAction`
 * / `applyEnrichmentAction` en `adminOps.ts`).
 */
export async function enrichFromWebsite(url: string): Promise<WebsiteEnrichment> {
  if (!isSafeExternalUrl(url)) {
    throw new Error("La URL no es válida o no es segura para consultarla.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENRICH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "DentalRankBot/1.0 (verificación de ficha; contacto: soporte@dentalrank.example)" },
    });

    // Revalida la URL final tras seguir redirecciones, por si el destino
    // resultara ser un host interno.
    if (!isSafeExternalUrl(res.url || url)) {
      throw new Error("La web redirige a una dirección no permitida.");
    }
    if (!res.ok || !res.body) {
      throw new Error(`No se pudo leer la web (HTTP ${res.status}).`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error("La URL no devuelve una página HTML.");
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > ENRICH_MAX_BYTES) {
          await reader.cancel().catch(() => {});
          break;
        }
        chunks.push(value);
      }
    }

    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
    const base = new URL(res.url || url);

    const title = matchTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = matchMeta(html, "description") ?? matchMeta(html, "og:description");
    const ogImage = matchMeta(html, "og:image");
    const iconHref = matchIcon(html);

    return {
      title: title ? decodeEntities(title).trim().slice(0, 160) || null : null,
      description: description ? decodeEntities(description).trim().slice(0, 400) || null : null,
      logoUrl: ogImage ? resolveSafeUrl(base, ogImage) : null,
      faviconUrl: iconHref ? resolveSafeUrl(base, iconHref) : resolveSafeUrl(base, "/favicon.ico"),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function matchTag(html: string, re: RegExp): string | null {
  return re.exec(html)?.[1] ?? null;
}

function matchMeta(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i");
  const alt = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i");
  return re.exec(html)?.[1] ?? alt.exec(html)?.[1] ?? null;
}

function matchIcon(html: string): string | null {
  const re = /<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]+href=["']([^"']*)["'][^>]*>/i;
  const alt = /<link[^>]+href=["']([^"']*)["'][^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*>/i;
  return re.exec(html)?.[1] ?? alt.exec(html)?.[1] ?? null;
}

function resolveSafeUrl(base: URL, href: string): string | null {
  try {
    const resolved = new URL(href, base);
    return isSafeExternalUrl(resolved.toString()) ? resolved.toString() : null;
  } catch {
    return null;
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}
