import { createHash } from "node:crypto";

const SALT = process.env.LEAD_HASH_SALT ?? "dentalrank-dev-salt";

/**
 * Hash irreversible de la IP. No almacenamos direcciones IP en claro:
 * solo necesitamos detectar duplicados y abuso, no identificar a la persona.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${SALT}:${ip}`).digest("hex").slice(0, 32);
}

export function hashValue(value: string): string {
  return createHash("sha256").update(`${SALT}:${value}`).digest("hex").slice(0, 32);
}

/** Normaliza un teléfono español para comparar duplicados. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("34") && digits.length === 11) return digits.slice(2);
  if (digits.startsWith("0034")) return digits.slice(4);
  return digits;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
