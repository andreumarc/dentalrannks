import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MARKET_DEFAULTS, MIN_TOPUP_EUROS, CLICK_DEDUPE_MINUTES, LEAD_DEDUPE_HOURS } from "./pricing";
import { topUpSchema } from "./validation";

/**
 * Estas cifras se publican en la página comercial. Si alguien cambia el
 * esquema de Prisma o la validación y no actualiza aquí, la clínica leería
 * una condición que el sistema no aplica. Estos tests convierten esa
 * divergencia en un fallo de build.
 */
const schema = readFileSync(join(process.cwd(), "prisma", "schema.prisma"), "utf8");

function prismaDefault(field: string): number | null {
  const match = schema.match(new RegExp(`${field}\\s+Int\\s+@default\\((\\d+)\\)`));
  return match ? Number(match[1]) : null;
}

describe("valores por defecto del mercado", () => {
  it("coinciden con los @default de AuctionMarket en el esquema de Prisma", () => {
    expect(prismaDefault("minimumBidCents")).toBe(MARKET_DEFAULTS.minimumBidCents);
    expect(prismaDefault("bidIncrementCents")).toBe(MARKET_DEFAULTS.bidIncrementCents);
    expect(prismaDefault("sponsoredSlots")).toBe(MARKET_DEFAULTS.sponsoredSlots);
  });

  it("la recarga mínima publicada es la que valida el formulario", () => {
    expect(topUpSchema.safeParse({ clinicId: "c1", amountEuros: MIN_TOPUP_EUROS }).success).toBe(true);
    expect(topUpSchema.safeParse({ clinicId: "c1", amountEuros: MIN_TOPUP_EUROS - 1 }).success).toBe(false);
  });

  it("las ventanas antifraude publicadas son coherentes con el código", () => {
    const clicks = readFileSync(join(process.cwd(), "src", "server", "clicks.ts"), "utf8");
    expect(clicks).toContain(`DEDUPE_WINDOW_MINUTES = ${CLICK_DEDUPE_MINUTES}`);

    const leads = readFileSync(join(process.cwd(), "src", "server", "leads.ts"), "utf8");
    // La deduplicación de leads se expresa como 24 * 60 * 60 * 1000 ms.
    expect(leads).toContain(`${LEAD_DEDUPE_HOURS} * 60 * 60 * 1000`);
  });
});
