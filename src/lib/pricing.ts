/**
 * Valores por defecto del sistema de pujas.
 *
 * Se muestran a las clínicas en la página comercial, así que no pueden
 * divergir de lo que hace el sistema. Son los mismos `@default` que declara
 * `AuctionMarket` en `prisma/schema.prisma`, y hay un test que compara ambos
 * archivos para que un cambio en el esquema rompa la build en lugar de dejar
 * una cifra mentirosa publicada.
 *
 * Cada mercado puede sobreescribirlos desde el back-office: lo que aquí se
 * documenta es el punto de partida, no una tarifa cerrada.
 */
export const MARKET_DEFAULTS = {
  /** Importe mínimo para entrar en un mercado. */
  minimumBidCents: 5000,
  /** Salto mínimo entre pujas. */
  bidIncrementCents: 1000,
  /** Posiciones patrocinadas visibles por búsqueda. */
  sponsoredSlots: 3,
} as const;

/** Recarga mínima de saldo, alineada con `topUpSchema` de `@/lib/validation`. */
export const MIN_TOPUP_EUROS = 50;

/** Ventana en la que un mismo visitante no genera un segundo clic facturable. */
export const CLICK_DEDUPE_MINUTES = 30;

/** Ventana en la que una solicitud repetida a la misma clínica se marca duplicada. */
export const LEAD_DEDUPE_HOURS = 24;
