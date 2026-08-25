import Stripe from "stripe";

/**
 * Cliente Stripe perezoso y único por proceso.
 *
 * Si `STRIPE_SECRET_KEY` no está configurada, devuelve `null` en lugar de
 * lanzar: la aplicación debe seguir funcionando con los pagos deshabilitados
 * (el checkout responde `{ disabled: true }` y el webhook responde 503).
 */
let cached: Stripe | null | undefined;

export function getStripeClient(): Stripe | null {
  if (cached !== undefined) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    cached = null;
    return cached;
  }

  cached = new Stripe(key, {
    apiVersion: "2025-08-27.basil",
    typescript: true,
  });
  return cached;
}
