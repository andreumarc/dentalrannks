import { describe, expect, it } from "vitest";
import { computeDentalRankScore, computeProfileCompleteness, scoreLabel, type ScoreInput } from "./score";

function baseInput(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    verified: false,
    profileCompleteness: 0,
    externalRating: null,
    externalReviewCount: 0,
    internalRating: null,
    internalReviewCount: 0,
    avgResponseMinutes: null,
    treatmentCount: 0,
    hasPhotos: false,
    hasSchedule: false,
    hasTeam: false,
    ...overrides,
  };
}

describe("computeDentalRankScore", () => {
  it("no depende de ningún importe económico: ScoreInput no tiene ningún campo de dinero", () => {
    // Comprobación estructural: la lista de claves de entrada del score no
    // incluye nada relacionado con pujas, saldo o pagos.
    const input = baseInput({ verified: true, profileCompleteness: 100 });
    const keys = Object.keys(input);
    const forbidden = ["amountCents", "bid", "balance", "payment", "spend", "cents", "price"];
    for (const key of keys) {
      const lower = key.toLowerCase();
      expect(forbidden.some((f) => lower.includes(f))).toBe(false);
    }
  });

  it("sube al verificar la clínica, con el resto de factores iguales", () => {
    const unverified = computeDentalRankScore(baseInput({ verified: false }));
    const verified = computeDentalRankScore(baseInput({ verified: true }));
    expect(verified.total).toBeGreaterThan(unverified.total);
  });

  it("sube con mejores reseñas (más volumen y mejor valoración)", () => {
    const fewReviews = computeDentalRankScore(baseInput({ externalRating: 4.5, externalReviewCount: 2 }));
    const manyGoodReviews = computeDentalRankScore(
      baseInput({ externalRating: 4.8, externalReviewCount: 120 }),
    );
    expect(manyGoodReviews.total).toBeGreaterThan(fewReviews.total);

    const badReviews = computeDentalRankScore(baseInput({ externalRating: 2.5, externalReviewCount: 50 }));
    const goodReviews = computeDentalRankScore(baseInput({ externalRating: 4.8, externalReviewCount: 50 }));
    expect(goodReviews.total).toBeGreaterThan(badReviews.total);
  });

  it("sube con mayor rapidez de respuesta", () => {
    const slow = computeDentalRankScore(baseInput({ avgResponseMinutes: 2000 }));
    const fast = computeDentalRankScore(baseInput({ avgResponseMinutes: 10 }));
    expect(fast.total).toBeGreaterThan(slow.total);
  });

  it("sube con mayor completitud de ficha", () => {
    const incomplete = computeDentalRankScore(baseInput({ profileCompleteness: 10 }));
    const complete = computeDentalRankScore(baseInput({ profileCompleteness: 100 }));
    expect(complete.total).toBeGreaterThan(incomplete.total);
  });

  it("queda siempre acotado entre 0 y 100", () => {
    const worst = computeDentalRankScore(baseInput());
    expect(worst.total).toBeGreaterThanOrEqual(0);
    expect(worst.total).toBeLessThanOrEqual(100);

    const best = computeDentalRankScore(
      baseInput({
        verified: true,
        profileCompleteness: 100,
        externalRating: 5,
        externalReviewCount: 1000,
        internalRating: 5,
        internalReviewCount: 1000,
        avgResponseMinutes: 1,
        treatmentCount: 50,
        hasPhotos: true,
        hasSchedule: true,
        hasTeam: true,
      }),
    );
    expect(best.total).toBeGreaterThanOrEqual(0);
    expect(best.total).toBeLessThanOrEqual(100);
  });

  it("cada componente respeta su propio máximo y la suma de puntos coincide con el total", () => {
    const { total, components } = computeDentalRankScore(
      baseInput({ verified: true, profileCompleteness: 80, externalRating: 4.5, externalReviewCount: 40 }),
    );
    for (const c of components) {
      expect(c.points).toBeGreaterThanOrEqual(0);
      expect(c.points).toBeLessThanOrEqual(c.max);
    }
    const sum = components.reduce((s, c) => s + c.points, 0);
    expect(total).toBe(Math.max(0, Math.min(100, sum)));
  });
});

describe("computeProfileCompleteness", () => {
  const emptyClinic = {
    description: null,
    logoUrl: null,
    coverUrl: null,
    phone: null,
    website: null,
    email: null,
    scheduleJson: null,
    imageCount: 0,
    treatmentCount: 0,
    teamCount: 0,
    languages: [] as string[],
    diagnostics: [] as string[],
  };

  it("devuelve 0 cuando ningún campo relevante está cumplimentado", () => {
    expect(computeProfileCompleteness(emptyClinic)).toBe(0);
  });

  it("devuelve 100 cuando todos los campos relevantes están cumplimentados", () => {
    const full = {
      description: "x".repeat(150),
      logoUrl: "logo.png",
      coverUrl: "cover.png",
      phone: "912345678",
      website: "https://example.com",
      email: "a@a.com",
      scheduleJson: { mon: [] },
      imageCount: 5,
      treatmentCount: 6,
      teamCount: 2,
      languages: ["es"],
      diagnostics: ["Radiografía digital"],
    };
    expect(computeProfileCompleteness(full)).toBe(100);
  });

  it("responde a cada campo individualmente (una descripción corta no cuenta)", () => {
    const shortDescription = computeProfileCompleteness({ ...emptyClinic, description: "muy corta" });
    expect(shortDescription).toBe(0);

    const longDescription = computeProfileCompleteness({ ...emptyClinic, description: "x".repeat(150) });
    expect(longDescription).toBeGreaterThan(0);
  });

  it("responde al número de imágenes, tratamientos y miembros del equipo", () => {
    const belowThreshold = computeProfileCompleteness({ ...emptyClinic, imageCount: 2, treatmentCount: 3, teamCount: 0 });
    const aboveThreshold = computeProfileCompleteness({ ...emptyClinic, imageCount: 3, treatmentCount: 4, teamCount: 1 });
    expect(aboveThreshold).toBeGreaterThan(belowThreshold);
  });
});

describe("scoreLabel", () => {
  it("clasifica los tramos alto, medio y bajo", () => {
    expect(scoreLabel(90)).toEqual({ label: "Perfil sólido", tone: "high" });
    expect(scoreLabel(75)).toEqual({ label: "Perfil sólido", tone: "high" });
    expect(scoreLabel(60)).toEqual({ label: "Perfil correcto", tone: "mid" });
    expect(scoreLabel(50)).toEqual({ label: "Perfil correcto", tone: "mid" });
    expect(scoreLabel(20)).toEqual({ label: "Perfil incompleto", tone: "low" });
  });
});
