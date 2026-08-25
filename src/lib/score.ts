/**
 * DentalRank Score (0-100).
 *
 * Regla innegociable: NINGÚN componente depende del importe pagado ni de la
 * posición patrocinada. Es una señal de calidad de ficha y de servicio, no un
 * juicio clínico ni una certificación sanitaria.
 */

export type ScoreInput = {
  verified: boolean;
  profileCompleteness: number; // 0-100
  externalRating: number | null; // 0-5
  externalReviewCount: number;
  internalRating: number | null; // 0-5
  internalReviewCount: number;
  avgResponseMinutes: number | null;
  treatmentCount: number;
  hasPhotos: boolean;
  hasSchedule: boolean;
  hasTeam: boolean;
};

export type ScoreBreakdown = {
  total: number;
  components: { key: string; label: string; points: number; max: number }[];
};

const WEIGHTS = {
  verification: 18,
  reviews: 24,
  responsiveness: 16,
  completeness: 22,
  services: 10,
  transparency: 10,
} as const;

function reviewPoints(
  rating: number | null,
  count: number,
  max: number,
): number {
  if (rating === null || count <= 0) return 0;
  // La confianza crece con el volumen y satura en 60 reseñas.
  const confidence = Math.min(1, Math.log10(count + 1) / Math.log10(61));
  const quality = Math.max(0, Math.min(1, (rating - 3) / 2));
  return Math.round(max * confidence * quality);
}

function responsePoints(minutes: number | null, max: number): number {
  if (minutes === null) return 0;
  if (minutes <= 15) return max;
  if (minutes <= 60) return Math.round(max * 0.8);
  if (minutes <= 240) return Math.round(max * 0.6);
  if (minutes <= 1440) return Math.round(max * 0.35);
  return Math.round(max * 0.1);
}

export function computeDentalRankScore(input: ScoreInput): ScoreBreakdown {
  const external = reviewPoints(
    input.externalRating,
    input.externalReviewCount,
    Math.round(WEIGHTS.reviews * 0.6),
  );
  const internal = reviewPoints(
    input.internalRating,
    input.internalReviewCount,
    Math.round(WEIGHTS.reviews * 0.4),
  );

  const transparencyItems = [input.hasPhotos, input.hasSchedule, input.hasTeam];
  const transparency = Math.round(
    (transparencyItems.filter(Boolean).length / transparencyItems.length) *
      WEIGHTS.transparency,
  );

  const components = [
    {
      key: "verification",
      label: "Clínica verificada",
      points: input.verified ? WEIGHTS.verification : 0,
      max: WEIGHTS.verification,
    },
    {
      key: "reviews",
      label: "Reseñas y valoración",
      points: external + internal,
      max: WEIGHTS.reviews,
    },
    {
      key: "responsiveness",
      label: "Tiempo de respuesta",
      points: responsePoints(input.avgResponseMinutes, WEIGHTS.responsiveness),
      max: WEIGHTS.responsiveness,
    },
    {
      key: "completeness",
      label: "Ficha completa",
      points: Math.round(
        (Math.max(0, Math.min(100, input.profileCompleteness)) / 100) * WEIGHTS.completeness,
      ),
      max: WEIGHTS.completeness,
    },
    {
      key: "services",
      label: "Tratamientos detallados",
      points: Math.round(Math.min(1, input.treatmentCount / 8) * WEIGHTS.services),
      max: WEIGHTS.services,
    },
    {
      key: "transparency",
      label: "Transparencia de la ficha",
      points: transparency,
      max: WEIGHTS.transparency,
    },
  ];

  const total = Math.max(
    0,
    Math.min(100, components.reduce((sum, c) => sum + c.points, 0)),
  );

  return { total, components };
}

/** Porcentaje de campos relevantes cumplimentados en la ficha pública. */
export function computeProfileCompleteness(clinic: {
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  scheduleJson: unknown;
  imageCount: number;
  treatmentCount: number;
  teamCount: number;
  languages: string[];
  diagnostics: string[];
}): number {
  const checks = [
    Boolean(clinic.description && clinic.description.length > 120),
    Boolean(clinic.logoUrl),
    Boolean(clinic.coverUrl),
    Boolean(clinic.phone),
    Boolean(clinic.website),
    Boolean(clinic.email),
    Boolean(clinic.scheduleJson),
    clinic.imageCount >= 3,
    clinic.treatmentCount >= 4,
    clinic.teamCount >= 1,
    clinic.languages.length > 0,
    clinic.diagnostics.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function scoreLabel(score: number): { label: string; tone: "high" | "mid" | "low" } {
  if (score >= 75) return { label: "Perfil sólido", tone: "high" };
  if (score >= 50) return { label: "Perfil correcto", tone: "mid" };
  return { label: "Perfil incompleto", tone: "low" };
}
