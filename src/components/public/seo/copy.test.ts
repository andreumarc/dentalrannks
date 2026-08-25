import { describe, expect, it } from "vitest";
import {
  comboTitle,
  comboDescription,
  comboSummaryText,
  priceUnavailableNote,
  comboPriceFaq,
  citiesWithTreatmentNearby,
  cityTitle,
  cityDescription,
  citySummaryText,
  formatPostalCodes,
  cityClinicCountFaq,
  cityFirstVisitFreeFaq,
  cityEmergencyFaq,
} from "./copy";
import type { ComboStats, CityWithTreatment, PriceStats } from "@/server/seo-stats";
import { MIN_PRICE_SAMPLE } from "@/server/seo-stats";

function stats(overrides: Partial<ComboStats> = {}): ComboStats {
  return {
    clinicCount: 5,
    verifiedCount: 2,
    price: null,
    averageRating: null,
    ratedClinicCount: 0,
    totalReviewCount: 0,
    firstVisitFreeCount: 0,
    financingCount: 0,
    emergencyCount: 0,
    postalCodes: [],
    ...overrides,
  };
}

const price: PriceStats = { minCents: 50000, medianCents: 70000, maxCents: 90000, sampleSize: 4 };

describe("comboTitle", () => {
  it("promete precios en el título solo cuando hay muestra de precio", () => {
    expect(comboTitle("Implantes", "Barcelona", 5, price)).toBe("Implantes en Barcelona: 5 clínicas y precios");
  });

  it("no menciona precios cuando price es null", () => {
    const title = comboTitle("Implantes", "Barcelona", 5, null);
    expect(title).not.toMatch(/precio/i);
    expect(title).toBe("Implantes en Barcelona: 5 clínicas");
  });

  it("usa singular con una sola clínica", () => {
    expect(comboTitle("Implantes", "Igualada", 1, null)).toBe("Implantes en Igualada: 1 clínica");
  });
});

describe("comboDescription", () => {
  it("incluye verificadas solo si hay alguna", () => {
    const desc = comboDescription("Implantes", "Barcelona", stats({ verifiedCount: 0 }));
    expect(desc).not.toMatch(/verificada/);
  });

  it("incluye el recuento de verificadas cuando existe", () => {
    const desc = comboDescription("Implantes", "Barcelona", stats({ verifiedCount: 3 }));
    expect(desc).toContain("3 verificadas");
  });

  it("nunca inventa un precio cuando price es null", () => {
    const desc = comboDescription("Implantes", "Barcelona", stats({ price: null }));
    expect(desc).not.toMatch(/desde \d/);
  });

  it("incluye el precio mínimo real cuando existe", () => {
    const desc = comboDescription("Implantes", "Barcelona", stats({ price }));
    expect(desc).toContain("500");
  });
});

describe("comboSummaryText", () => {
  it("usa 'ofrece' en singular y 'ofrecen' en plural", () => {
    expect(comboSummaryText("Implantes", "Igualada", stats({ clinicCount: 1, verifiedCount: 0 }))).toMatch(/^1 clínica ofrece/);
    expect(comboSummaryText("Implantes", "Barcelona", stats({ clinicCount: 5, verifiedCount: 0 }))).toMatch(/^5 clínicas ofrecen/);
  });
});

describe("priceUnavailableNote", () => {
  it("cita el mínimo real de muestra, no un número inventado", () => {
    expect(priceUnavailableNote("Igualada")).toContain(String(MIN_PRICE_SAMPLE));
  });
});

describe("comboPriceFaq", () => {
  it("responde con las tres cifras reales y el tamaño de muestra", () => {
    const faq = comboPriceFaq("Implantes", "Barcelona", price);
    expect(faq.question).toBe("¿Cuánto cuesta implantes en Barcelona?");
    expect(faq.answer).toContain("4 clínicas");
    expect(faq.answer).toMatch(/desde/);
    expect(faq.answer).toMatch(/hasta/);
    expect(faq.answer).toMatch(/mediana/);
  });
});

describe("citiesWithTreatmentNearby", () => {
  const city = (slug: string, distanceKm: number | null = 10): CityWithTreatment => ({
    slug,
    name: slug,
    provinceName: "Barcelona",
    clinicCount: 1,
    distanceKm,
  });

  it("conserva solo los municipios cercanos que también tienen el tratamiento", () => {
    const nearby = [city("a", 5), city("b", 8), city("c", 12)];
    const withTreatment = [city("b"), city("d")];
    expect(citiesWithTreatmentNearby(nearby, withTreatment).map((c) => c.slug)).toEqual(["b"]);
  });

  it("conserva el orden por distancia de `nearby`, no el de `citiesForTreatment`", () => {
    const nearby = [city("far", 20), city("near", 2)];
    const withTreatment = [city("far"), city("near")];
    expect(citiesWithTreatmentNearby(nearby, withTreatment).map((c) => c.slug)).toEqual(["far", "near"]);
  });

  it("respeta el límite", () => {
    const nearby = [city("a"), city("b"), city("c")];
    const withTreatment = nearby;
    expect(citiesWithTreatmentNearby(nearby, withTreatment, 2)).toHaveLength(2);
  });
});

describe("cityTitle", () => {
  it("omite el recuento cuando no hay ninguna clínica", () => {
    expect(cityTitle("Igualada", 0)).toBe("Dentistas en Igualada");
  });

  it("incluye el recuento real en plural y singular", () => {
    expect(cityTitle("Barcelona", 40)).toBe("Dentistas en Barcelona: 40 clínicas");
    expect(cityTitle("Igualada", 1)).toBe("Dentistas en Igualada: 1 clínica");
  });
});

describe("cityDescription", () => {
  it("es honesta cuando no hay clínicas todavía", () => {
    const desc = cityDescription("Igualada", "Barcelona", 0);
    expect(desc).toMatch(/todavía no hay/i);
  });

  it("incluye la provincia y el recuento real", () => {
    const desc = cityDescription("Igualada", "Barcelona", 6);
    expect(desc).toContain("Igualada");
    expect(desc).toContain("Barcelona");
    expect(desc).toContain("6");
  });
});

describe("citySummaryText", () => {
  it("no menciona verificadas si el recuento es cero", () => {
    expect(citySummaryText("Igualada", 4, 0)).not.toMatch(/verificada/);
  });

  it("menciona verificadas cuando hay alguna", () => {
    expect(citySummaryText("Igualada", 4, 2)).toContain("2 de ellas verificadas");
  });
});

describe("formatPostalCodes", () => {
  it("devuelve vacío sin códigos", () => {
    expect(formatPostalCodes([])).toBe("");
  });

  it("los une con coma cuando caben todos", () => {
    expect(formatPostalCodes(["08001", "08002"])).toBe("08001, 08002");
  });

  it("recorta y añade puntos suspensivos cuando hay demasiados", () => {
    const codes = Array.from({ length: 12 }, (_, i) => `0800${i}`);
    const result = formatPostalCodes(codes, 8);
    expect(result.endsWith("…")).toBe(true);
    expect(result.split(", ")).toHaveLength(8);
  });
});

describe("FAQ de municipio", () => {
  it("cityClinicCountFaq usa el recuento real", () => {
    expect(cityClinicCountFaq("Igualada", 6).answer).toContain("6");
  });

  it("cityFirstVisitFreeFaq es honesta cuando el recuento es cero", () => {
    expect(cityFirstVisitFreeFaq("Igualada", 6, 0).answer).toMatch(/ninguna/i);
  });

  it("cityFirstVisitFreeFaq cita la cifra real cuando hay alguna", () => {
    expect(cityFirstVisitFreeFaq("Igualada", 6, 3).answer).toContain("3 de las 6");
  });

  it("cityEmergencyFaq responde 'no' honestamente sin inventar clínicas", () => {
    expect(cityEmergencyFaq("Igualada", 6, 0).answer).toMatch(/ninguna/i);
  });
});
