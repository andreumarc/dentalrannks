import { prisma } from "@/lib/prisma";
import { hashValue } from "@/lib/hash";

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

/**
 * Limitador de peticiones persistente (una fila por bucket+clave).
 * Suficiente para formularios públicos y endpoints sensibles en serverless.
 */
export async function rateLimit(
  bucket: string,
  rawKey: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const key = hashValue(rawKey);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  try {
    const existing = await prisma.rateLimitHit.findUnique({
      where: { bucket_key: { bucket, key } },
    });

    if (!existing || existing.expiresAt <= now) {
      await prisma.rateLimitHit.upsert({
        where: { bucket_key: { bucket, key } },
        create: { bucket, key, count: 1, expiresAt },
        update: { count: 1, expiresAt },
      });
      return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    if (existing.count >= limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000),
        ),
      };
    }

    const updated = await prisma.rateLimitHit.update({
      where: { bucket_key: { bucket, key } },
      data: { count: { increment: 1 } },
    });
    return { ok: true, remaining: Math.max(0, limit - updated.count), retryAfterSeconds: 0 };
  } catch {
    // Ante un fallo de base de datos no bloqueamos al usuario legítimo.
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}
