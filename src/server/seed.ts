/**
 * Datos de demostración para DentalRank.
 *
 * NO usar en un entorno con datos reales de clínicas: `runSeed({ reset: true })`
 * borra todo el contenido gestionado por este seed (geografía, taxonomía,
 * organizaciones/clínicas y todo lo que cuelga de ellas, además de los
 * usuarios de demo con email @dentalrank.es) y lo vuelve a crear desde cero.
 *
 * Reglas de diseño de este archivo:
 *  - Todo el azar pasa por un generador con semilla fija (`mulberry32`), nunca
 *    `Math.random()`, para que el resultado sea reproducible entre ejecuciones.
 *  - Todo el dinero se genera y se guarda en céntimos enteros.
 *  - El saldo del wallet es SIEMPRE la suma exacta de los asientos del ledger
 *    que se insertan para esa clínica: se calcula el encadenado de saldos en
 *    memoria y se inserta ya calculado, replicando la invariante que en
 *    producción aplica `postLedgerEntry` (src/server/ledger.ts).
 *  - El DentalRank Score y la completitud de ficha se calculan con las
 *    funciones reales de `src/lib/score.ts`; no se duplica esa lógica aquí.
 *  - Las posiciones patrocinadas se calculan con `persistPositions` de
 *    `src/server/markets.ts`, la misma función que usa la aplicación en
 *    producción, para que la demo sea coherente con el motor real.
 *  - Se generan los IDs manualmente (`randomUUID`) para poder usar `createMany`
 *    en lote y enlazar relaciones sin tener que releer la base de datos.
 */

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import type {
  BidStatus,
  ClickType,
  ClinicStatus,
  ConsentType,
  LeadEventType,
  LeadQuality,
  LeadSource,
  LeadStatus,
  LedgerEntryType,
  LedgerReason,
  MarketStatus,
  PricingModel,
  ReviewStatus,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeDentalRankScore, computeProfileCompleteness } from "@/lib/score";
import { CONSENT_TEXTS, CONSENT_VERSION } from "@/lib/consent";
import { hashIp } from "@/lib/hash";
import { CLINIC_PHOTOS } from "@/lib/images";
import { slugify } from "@/lib/utils";
import { persistPositions } from "@/server/markets";

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

/** Semilla fija: la misma entrada produce siempre el mismo dataset de demo. */
const SEED_RNG_SEED = 20260824;

/**
 * Contraseña de demo para todos los usuarios sembrados. Se puede sobreescribir
 * con la variable de entorno SEED_PASSWORD antes de ejecutar el seed.
 * Valor por defecto documentado: "DentalRank2026!" (cumple las reglas de
 * `clinicSignupSchema`: 8+ caracteres, letra y número).
 */
const DEFAULT_SEED_PASSWORD = "DentalRank2026!";

/**
 * Fuente de la valoración externa agregada. Es un valor neutro de demostración:
 * NO afirma que las reseñas provengan de Google, Facebook ni de ninguna
 * plataforma concreta. En producción este campo se rellenará con el origen
 * real cuando se integre una fuente autorizada.
 */
const DEMO_EXTERNAL_SOURCE = "agregado-demo";

// ---------------------------------------------------------------------------
// Generador pseudoaleatorio con semilla fija (mulberry32)
// ---------------------------------------------------------------------------

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng: Rng, min: number, max: number, decimals = 1): number {
  const value = rng() * (max - min) + min;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function pickN<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

function weightedPick<T>(rng: Rng, items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }
  return items[items.length - 1]!.value;
}

function roundToCents(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Redondea un importe en céntimos al múltiplo de `step` euros más cercano. */
function priceCents(rng: Rng, minCents: number, maxCents: number, stepCents = 100): number {
  const raw = randInt(rng, minCents, maxCents);
  return roundToCents(raw, stepCents);
}

// ---------------------------------------------------------------------------
// Datos estáticos: geografía real de España
// ---------------------------------------------------------------------------

type RegionSeed = { name: string; slug: string; code: string };
type ProvinceSeed = { name: string; slug: string; code: string; regionSlug: string };
type CitySeed = {
  name: string;
  slug: string;
  provinceSlug: string;
  postalCode: string;
  lat: number;
  lng: number;
  population: number;
  featured: boolean;
};

const REGIONS: RegionSeed[] = [
  { name: "Comunidad de Madrid", slug: "comunidad-de-madrid", code: "MD" },
  { name: "Cataluña", slug: "cataluna", code: "CT" },
  { name: "Comunidad Valenciana", slug: "comunidad-valenciana", code: "VC" },
  { name: "Andalucía", slug: "andalucia", code: "AN" },
  { name: "Aragón", slug: "aragon", code: "AR" },
  { name: "País Vasco", slug: "pais-vasco", code: "PV" },
  { name: "Región de Murcia", slug: "region-de-murcia", code: "MC" },
  { name: "Illes Balears", slug: "illes-balears", code: "IB" },
  { name: "Castilla y León", slug: "castilla-y-leon", code: "CL" },
  { name: "Galicia", slug: "galicia", code: "GA" },
  { name: "Principado de Asturias", slug: "principado-de-asturias", code: "AS" },
];

const PROVINCES: ProvinceSeed[] = [
  { name: "Madrid", slug: "madrid-provincia", code: "M", regionSlug: "comunidad-de-madrid" },
  { name: "Barcelona", slug: "barcelona-provincia", code: "B", regionSlug: "cataluna" },
  { name: "Valencia", slug: "valencia-provincia", code: "V", regionSlug: "comunidad-valenciana" },
  { name: "Alicante", slug: "alicante-provincia", code: "A", regionSlug: "comunidad-valenciana" },
  { name: "Sevilla", slug: "sevilla-provincia", code: "SE", regionSlug: "andalucia" },
  { name: "Málaga", slug: "malaga-provincia", code: "MA", regionSlug: "andalucia" },
  { name: "Córdoba", slug: "cordoba-provincia", code: "CO", regionSlug: "andalucia" },
  { name: "Granada", slug: "granada-provincia", code: "GR", regionSlug: "andalucia" },
  { name: "Zaragoza", slug: "zaragoza-provincia", code: "Z", regionSlug: "aragon" },
  { name: "Bizkaia", slug: "bizkaia-provincia", code: "BI", regionSlug: "pais-vasco" },
  { name: "Murcia", slug: "murcia-provincia", code: "MU", regionSlug: "region-de-murcia" },
  { name: "Balears", slug: "balears-provincia", code: "PM", regionSlug: "illes-balears" },
  { name: "Valladolid", slug: "valladolid-provincia", code: "VA", regionSlug: "castilla-y-leon" },
  { name: "Pontevedra", slug: "pontevedra-provincia", code: "PO", regionSlug: "galicia" },
  { name: "Asturias", slug: "asturias-provincia", code: "O", regionSlug: "principado-de-asturias" },
];

/** 20 municipios con coordenadas reales. ~10 destacados (los de mayor población). */
const CITIES: CitySeed[] = [
  { name: "Madrid", slug: "madrid", provinceSlug: "madrid-provincia", postalCode: "28001", lat: 40.4168, lng: -3.7038, population: 3_300_000, featured: true },
  { name: "Barcelona", slug: "barcelona", provinceSlug: "barcelona-provincia", postalCode: "08001", lat: 41.3851, lng: 2.1734, population: 1_620_000, featured: true },
  { name: "Valencia", slug: "valencia", provinceSlug: "valencia-provincia", postalCode: "46001", lat: 39.4699, lng: -0.3763, population: 800_000, featured: true },
  { name: "Sevilla", slug: "sevilla", provinceSlug: "sevilla-provincia", postalCode: "41001", lat: 37.3891, lng: -5.9845, population: 684_000, featured: true },
  { name: "Zaragoza", slug: "zaragoza", provinceSlug: "zaragoza-provincia", postalCode: "50001", lat: 41.6488, lng: -0.8891, population: 675_000, featured: true },
  { name: "Málaga", slug: "malaga", provinceSlug: "malaga-provincia", postalCode: "29001", lat: 36.7213, lng: -4.4214, population: 578_000, featured: true },
  { name: "Bilbao", slug: "bilbao", provinceSlug: "bizkaia-provincia", postalCode: "48001", lat: 43.2630, lng: -2.9350, population: 345_000, featured: true },
  { name: "Murcia", slug: "murcia", provinceSlug: "murcia-provincia", postalCode: "30001", lat: 37.9922, lng: -1.1307, population: 460_000, featured: true },
  { name: "Palma", slug: "palma", provinceSlug: "balears-provincia", postalCode: "07001", lat: 39.5696, lng: 2.6502, population: 416_000, featured: true },
  { name: "Alicante", slug: "alicante", provinceSlug: "alicante-provincia", postalCode: "03001", lat: 38.3452, lng: -0.4810, population: 337_000, featured: true },
  { name: "Córdoba", slug: "cordoba", provinceSlug: "cordoba-provincia", postalCode: "14001", lat: 37.8882, lng: -4.7794, population: 325_000, featured: false },
  { name: "Valladolid", slug: "valladolid", provinceSlug: "valladolid-provincia", postalCode: "47001", lat: 41.6523, lng: -4.7245, population: 298_000, featured: false },
  { name: "Vigo", slug: "vigo", provinceSlug: "pontevedra-provincia", postalCode: "36201", lat: 42.2406, lng: -8.7207, population: 294_000, featured: false },
  { name: "Gijón", slug: "gijon", provinceSlug: "asturias-provincia", postalCode: "33201", lat: 43.5322, lng: -5.6611, population: 271_000, featured: false },
  { name: "L'Hospitalet de Llobregat", slug: "lhospitalet-de-llobregat", provinceSlug: "barcelona-provincia", postalCode: "08901", lat: 41.3598, lng: 2.0990, population: 264_000, featured: false },
  { name: "Granada", slug: "granada", provinceSlug: "granada-provincia", postalCode: "18001", lat: 37.1773, lng: -3.5986, population: 232_000, featured: false },
  { name: "Badalona", slug: "badalona", provinceSlug: "barcelona-provincia", postalCode: "08911", lat: 41.4500, lng: 2.2474, population: 220_000, featured: false },
  { name: "Sabadell", slug: "sabadell", provinceSlug: "barcelona-provincia", postalCode: "08201", lat: 41.5463, lng: 2.1086, population: 216_000, featured: false },
  { name: "Terrassa", slug: "terrassa", provinceSlug: "barcelona-provincia", postalCode: "08221", lat: 41.5638, lng: 2.0089, population: 215_000, featured: false },
  { name: "Igualada", slug: "igualada", provinceSlug: "barcelona-provincia", postalCode: "08700", lat: 41.5794, lng: 1.6169, population: 40_000, featured: false },
];

// ---------------------------------------------------------------------------
// Datos estáticos: taxonomía de tratamientos
// ---------------------------------------------------------------------------

type TreatmentSeed = {
  name: string;
  slug: string;
  shortName: string;
  featured: boolean;
  minCents: number;
  maxCents: number;
};

type CategorySeed = {
  name: string;
  slug: string;
  icon: string;
  treatments: TreatmentSeed[];
};

const CATEGORIES: CategorySeed[] = [
  {
    name: "Implantología",
    slug: "implantes",
    icon: "implant",
    treatments: [
      { name: "Implante unitario", slug: "implante-unitario", shortName: "Implante", featured: true, minCents: 90_000, maxCents: 180_000 },
      { name: "All-on-4", slug: "all-on-4", shortName: "All-on-4", featured: true, minCents: 700_000, maxCents: 1_200_000 },
      { name: "All-on-6", slug: "all-on-6", shortName: "All-on-6", featured: false, minCents: 900_000, maxCents: 1_500_000 },
      { name: "Carga inmediata", slug: "carga-inmediata", shortName: "Carga inmediata", featured: false, minCents: 120_000, maxCents: 250_000 },
      { name: "Regeneración ósea", slug: "regeneracion-osea", shortName: "Regeneración ósea", featured: false, minCents: 40_000, maxCents: 120_000 },
    ],
  },
  {
    name: "Ortodoncia",
    slug: "ortodoncia",
    icon: "braces",
    treatments: [
      { name: "Invisalign", slug: "invisalign", shortName: "Invisalign", featured: true, minCents: 250_000, maxCents: 550_000 },
      { name: "Ortodoncia invisible", slug: "ortodoncia-invisible", shortName: "Orto. invisible", featured: true, minCents: 200_000, maxCents: 450_000 },
      { name: "Brackets", slug: "brackets", shortName: "Brackets", featured: false, minCents: 180_000, maxCents: 350_000 },
      { name: "Ortodoncia infantil", slug: "ortodoncia-infantil", shortName: "Orto. infantil", featured: false, minCents: 120_000, maxCents: 250_000 },
    ],
  },
  {
    name: "Estética dental",
    slug: "estetica",
    icon: "sparkle",
    treatments: [
      { name: "Carillas", slug: "carillas", shortName: "Carillas", featured: true, minCents: 30_000, maxCents: 60_000 },
      { name: "Blanqueamiento", slug: "blanqueamiento", shortName: "Blanqueamiento", featured: true, minCents: 15_000, maxCents: 35_000 },
      { name: "Diseño de sonrisa", slug: "diseno-de-sonrisa", shortName: "Diseño de sonrisa", featured: false, minCents: 150_000, maxCents: 400_000 },
    ],
  },
  {
    name: "Odontología general",
    slug: "general",
    icon: "tooth",
    treatments: [
      { name: "Limpieza dental", slug: "limpieza-dental", shortName: "Limpieza", featured: true, minCents: 3_000, maxCents: 7_000 },
      { name: "Empaste", slug: "empaste", shortName: "Empaste", featured: false, minCents: 4_000, maxCents: 9_000 },
      { name: "Endodoncia", slug: "endodoncia", shortName: "Endodoncia", featured: false, minCents: 15_000, maxCents: 35_000 },
      { name: "Extracción", slug: "extraccion", shortName: "Extracción", featured: false, minCents: 4_000, maxCents: 15_000 },
    ],
  },
  {
    name: "Prótesis dental",
    slug: "protesis",
    icon: "crown",
    treatments: [
      { name: "Corona dental", slug: "corona-dental", shortName: "Corona", featured: false, minCents: 35_000, maxCents: 70_000 },
      { name: "Puente dental", slug: "puente-dental", shortName: "Puente", featured: false, minCents: 70_000, maxCents: 180_000 },
      { name: "Prótesis removible", slug: "protesis-removible", shortName: "Prótesis removible", featured: false, minCents: 40_000, maxCents: 120_000 },
    ],
  },
  {
    name: "Periodoncia",
    slug: "periodoncia",
    icon: "gum",
    treatments: [
      { name: "Tratamiento periodontal", slug: "tratamiento-periodontal", shortName: "Periodoncia", featured: false, minCents: 20_000, maxCents: 50_000 },
      { name: "Curetaje dental", slug: "curetaje-dental", shortName: "Curetaje", featured: false, minCents: 8_000, maxCents: 20_000 },
    ],
  },
  {
    name: "Odontopediatría",
    slug: "odontopediatria",
    icon: "child",
    treatments: [
      { name: "Revisión infantil", slug: "revision-infantil", shortName: "Revisión infantil", featured: false, minCents: 2_000, maxCents: 5_000 },
      { name: "Selladores dentales", slug: "selladores-dentales", shortName: "Selladores", featured: false, minCents: 1_500, maxCents: 4_000 },
    ],
  },
  {
    name: "Urgencias",
    slug: "urgencias",
    icon: "alert",
    treatments: [
      { name: "Urgencia dental", slug: "urgencia-dental", shortName: "Urgencia", featured: true, minCents: 6_000, maxCents: 15_000 },
      { name: "Dolor dental agudo", slug: "dolor-dental", shortName: "Dolor dental", featured: false, minCents: 5_000, maxCents: 12_000 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Datos estáticos: léxico para generar nombres, direcciones y textos
// ---------------------------------------------------------------------------

const CLINIC_PREFIXES = [
  "Clínica Dental",
  "Centro Dental",
  "Instituto Dental",
  "Clínica Odontológica",
  "Dental",
  "Sonrisas",
  "Policlínica Dental",
];

const CLINIC_CORE_WORDS = [
  "Aurora", "Vitalis", "Bellver", "Meridian", "Nortis", "Solaria", "Alameda",
  "Rivera", "Altamira", "Camino", "Delta", "Esencia", "Faro", "Girasol",
  "Horizonte", "Jardín", "Luz", "Mirasierra", "Nova", "Oliva", "Prisma",
  "Quinta", "Raíz", "Serena", "Trébol", "Umbral", "Valle", "Yara", "Zenit",
  "Céntrica", "Costa", "Puerta Real", "San Marcos", "Los Álamos",
];

const GROUP_NAMES = ["Grupo Dental Aurora", "Grupo Odontológico Meridian", "Sonrisa Ibérica Dental"];

const STREET_NAMES = [
  "Calle Mayor", "Avenida de la Constitución", "Calle Real", "Paseo de la Castellana",
  "Calle San Juan", "Avenida de Europa", "Calle del Sol", "Plaza España",
  "Calle Alcalá", "Avenida del Puerto", "Rambla Nova", "Calle Larga",
  "Avenida de Andalucía", "Calle Nueva", "Paseo Marítimo", "Calle Colón",
];

const FIRST_NAMES = [
  "María", "Carmen", "Laura", "Ana", "Marta", "Sara", "Lucía", "Elena",
  "Javier", "Carlos", "David", "Alejandro", "Pablo", "Miguel", "Daniel", "Adrián",
  "Isabel", "Cristina", "Raquel", "Paula", "Jorge", "Rubén", "Sergio", "Diego",
];

const LAST_NAMES = [
  "García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Fernández",
  "Díaz", "Moreno", "Álvarez", "Romero", "Navarro", "Torres", "Domínguez",
  "Vázquez", "Ramos", "Gil", "Serrano", "Blanco", "Suárez",
];

const TEAM_ROLES = [
  "Director/a médico", "Odontólogo/a", "Higienista dental", "Ortodoncista",
  "Cirujano/a maxilofacial", "Auxiliar de clínica",
];

const TAGLINES = [
  "Tu sonrisa, nuestra prioridad",
  "Odontología cercana y de confianza",
  "Cuidamos tu sonrisa a cada paso",
  "Tecnología dental al servicio de tu salud",
  "Atención personalizada desde el primer día",
  "Sonríe con total tranquilidad",
];

const DESCRIPTION_TEMPLATES = [
  (clinic: string, city: string, category: string) =>
    `${clinic} es una clínica dental en ${city} especializada en ${category}. Contamos con un equipo cercano, instalaciones modernas y un plan de tratamiento adaptado a cada paciente, explicando siempre las opciones disponibles antes de empezar cualquier procedimiento.`,
  (clinic: string, city: string, category: string) =>
    `En ${clinic}, en pleno centro de ${city}, combinamos experiencia clínica en ${category} con tecnología de diagnóstico actualizada. Nuestro objetivo es ofrecer un trato humano y transparente, con presupuestos claros y sin sorpresas.`,
  (clinic: string, city: string, category: string) =>
    `${clinic} lleva años atendiendo a familias de ${city}. Además de ${category}, ofrecemos un seguimiento continuo del paciente y facilidades de pago para que ningún tratamiento se quede a medias por motivos económicos.`,
];

const LANGUAGE_POOL = ["es", "ca", "en", "fr", "de"];
const DIAGNOSTIC_POOL = ["Radiografía digital", "Escáner intraoral 3D", "CBCT / TAC dental", "Fotografía clínica digital"];
const FACILITY_POOL = ["Sala infantil", "Wifi gratuito", "Cafetera de cortesía", "Revistas y prensa", "Zona de espera amplia", "Cargador de móvil"];

const FINANCING_NOTES = [
  "Financiación a 12, 24 o 36 meses sin intereses.",
  "Financiación hasta en 48 meses con entidades colaboradoras.",
  "Facilidades de pago adaptadas a cada presupuesto.",
];

const REVIEW_TITLES_POSITIVE = [
  "Muy contento con el tratamiento",
  "Trato excelente y buen resultado",
  "Recomendable al cien por cien",
  "Profesionales y buen precio",
  "Volveré sin duda",
];

const REVIEW_TITLES_NEUTRAL = [
  "Correcto en general",
  "Cumplió lo prometido",
  "Bien, aunque con esperas",
];

const REVIEW_TITLES_NEGATIVE = [
  "Esperaba más por el precio",
  "Tardaron bastante en atenderme",
  "Experiencia mejorable",
];

const REVIEW_BODIES = [
  "El equipo me explicó todo el proceso con detalle y resolvieron mis dudas antes de empezar.",
  "La cita se ajustó bien a mi horario y el resultado final fue el esperado.",
  "El presupuesto se cumplió sin sorpresas de última hora.",
  "Tuve que esperar más de lo que me hubiera gustado, pero el trato fue correcto.",
  "El seguimiento posterior al tratamiento fue constante, lo cual se agradece.",
  "Instalaciones limpias y modernas, y personal muy amable.",
];

const LOST_REASONS = [
  "No responde a las llamadas",
  "Eligió otra clínica",
  "Precio fuera de presupuesto",
  "Cambió de opinión sobre el tratamiento",
  "Se mudó de ciudad",
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.6 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Firefox/130.0",
];

const REFERRERS: (string | null)[] = [
  "https://www.google.com/",
  "https://www.google.com/search?q=dentista",
  null,
  "https://www.bing.com/",
  "https://www.instagram.com/",
];

/** Rangos IP reservados para documentación (RFC 5737): nunca corresponden a usuarios reales. */
const DEMO_IP_RANGES = ["203.0.113", "198.51.100", "192.0.2"];

// ---------------------------------------------------------------------------
// Tipos del plan en memoria
// ---------------------------------------------------------------------------

type ClinicPlan = {
  id: string;
  organizationId: string;
  organizationSlug: string;
  slug: string;
  name: string;
  citySlug: string;
  cityId: string;
  status: ClinicStatus;
  verificationStatus: VerificationStatus;
  treatmentSlugs: string[];
  imageCount: number;
  teamCount: number;
  reviewRatings: number[]; // solo de reseñas internas PUBLISHED
  languages: string[];
  diagnostics: string[];
  scheduleJson: Record<string, [string, string][]> | null;
  hasLogo: boolean;
  hasCover: boolean;
};

export type SeedSummary = {
  alreadySeeded: boolean;
  regions: number;
  provinces: number;
  cities: number;
  categories: number;
  treatments: number;
  organizations: number;
  clinics: number;
  clinicTreatments: number;
  markets: number;
  bids: number;
  wallets: number;
  walletTransactions: number;
  clicks: number;
  leads: number;
  reviews: number;
  users: number;
};

export type SeedOptions = {
  /** Si es true, borra todos los datos de demo antes de volver a sembrar. */
  reset?: boolean;
};

// ---------------------------------------------------------------------------
// Entrada principal
// ---------------------------------------------------------------------------

export async function runSeed(options: SeedOptions = {}): Promise<SeedSummary> {
  const { reset = false } = options;

  if (reset) {
    await resetDemoData();
  } else {
    const already = await prisma.user.findUnique({ where: { email: "admin@dentalrank.es" } });
    if (already) {
      return summarizeExisting();
    }
  }

  const rng = mulberry32(SEED_RNG_SEED);
  const now = new Date();
  const seedPassword = process.env.SEED_PASSWORD ?? DEFAULT_SEED_PASSWORD;
  const passwordHash = bcrypt.hashSync(seedPassword, 10);

  // -------------------------------------------------------------------
  // 1. Geografía
  // -------------------------------------------------------------------
  const regionRows = REGIONS.map((r) => ({ id: randomUUID(), name: r.name, slug: r.slug, code: r.code }));
  await prisma.region.createMany({ data: regionRows });
  const regionIdBySlug = new Map(regionRows.map((r) => [r.slug, r.id]));

  const provinceRows = PROVINCES.map((p) => ({
    id: randomUUID(),
    name: p.name,
    slug: p.slug,
    code: p.code,
    regionId: regionIdBySlug.get(p.regionSlug)!,
  }));
  await prisma.province.createMany({ data: provinceRows });
  const provinceIdBySlug = new Map(provinceRows.map((p) => [p.slug, p.id]));

  const cityRows = CITIES.map((c) => ({
    id: randomUUID(),
    name: c.name,
    slug: c.slug,
    postalCode: c.postalCode,
    lat: c.lat,
    lng: c.lng,
    population: c.population,
    featured: c.featured,
    provinceId: provinceIdBySlug.get(c.provinceSlug)!,
  }));
  await prisma.city.createMany({ data: cityRows });
  const cityIdBySlug = new Map(cityRows.map((c) => [c.slug, c.id]));

  // -------------------------------------------------------------------
  // 2. Taxonomía de tratamientos
  // -------------------------------------------------------------------
  const categoryRows = CATEGORIES.map((cat, i) => ({
    id: randomUUID(),
    name: cat.name,
    slug: cat.slug,
    order: i,
    icon: cat.icon,
  }));
  await prisma.treatmentCategory.createMany({ data: categoryRows });
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

  const treatmentRows: {
    id: string;
    name: string;
    slug: string;
    shortName: string;
    order: number;
    featured: boolean;
    categoryId: string;
  }[] = [];
  const treatmentPriceBySlug = new Map<string, { minCents: number; maxCents: number }>();
  const treatmentIdBySlug = new Map<string, string>();

  CATEGORIES.forEach((cat) => {
    cat.treatments.forEach((t, i) => {
      const id = randomUUID();
      treatmentRows.push({
        id,
        name: t.name,
        slug: t.slug,
        shortName: t.shortName,
        order: i,
        featured: t.featured,
        categoryId: categoryIdBySlug.get(cat.slug)!,
      });
      treatmentPriceBySlug.set(t.slug, { minCents: t.minCents, maxCents: t.maxCents });
      treatmentIdBySlug.set(t.slug, id);
    });
  });
  await prisma.treatment.createMany({ data: treatmentRows });

  // -------------------------------------------------------------------
  // 3. Organizaciones y clínicas
  // -------------------------------------------------------------------
  const allTreatmentSlugs = treatmentRows.map((t) => t.slug);
  const categorySlugByTreatmentSlug = new Map<string, string>();
  CATEGORIES.forEach((cat) => cat.treatments.forEach((t) => categorySlugByTreatmentSlug.set(t.slug, cat.name)));

  const usedClinicSlugs = new Set<string>();
  const usedOrgSlugs = new Set<string>();
  const usedClinicNames = new Set<string>();

  function uniqueSlug(base: string, used: Set<string>): string {
    let slug = slugify(base);
    let n = 2;
    while (used.has(slug)) {
      slug = `${slugify(base)}-${n}`;
      n += 1;
    }
    used.add(slug);
    return slug;
  }

  function generateClinicName(): string {
    let name = "";
    let attempts = 0;
    do {
      name = `${pick(rng, CLINIC_PREFIXES)} ${pick(rng, CLINIC_CORE_WORDS)}`;
      attempts += 1;
    } while (usedClinicNames.has(name) && attempts < 30);
    usedClinicNames.add(name);
    return name;
  }

  // Grupos multiclínica: prueban el caso de una organización con varias fichas.
  const groupSpecs: { name: string; citySlugs: string[] }[] = [
    { name: GROUP_NAMES[0]!, citySlugs: ["madrid", "madrid", "barcelona"] },
    { name: GROUP_NAMES[1]!, citySlugs: ["sevilla", "malaga", "cordoba"] },
    { name: GROUP_NAMES[2]!, citySlugs: ["bilbao", "bilbao"] },
  ];

  type OrgSpec = { name: string; citySlug: string; isGroup: boolean };
  const orgSpecs: OrgSpec[] = [];
  for (const g of groupSpecs) {
    for (const citySlug of g.citySlugs) orgSpecs.push({ name: g.name, citySlug, isGroup: true });
  }

  const independentClinicCount = 50 - orgSpecs.length;
  const cityWeights = CITIES.map((c) => ({ value: c.slug, weight: c.population }));
  for (let i = 0; i < independentClinicCount; i++) {
    const citySlug = weightedPick(rng, cityWeights);
    orgSpecs.push({ name: generateClinicName(), citySlug, isGroup: false });
  }

  const organizationRows: {
    id: string;
    name: string;
    slug: string;
    legalName: string;
    taxId: string;
    billingEmail: string;
    phone: string;
  }[] = [];
  const orgIdByGroupName = new Map<string, string>();

  const clinicRows: {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    legalName: string;
    taxId: string;
    address: string;
    postalCode: string;
    cityId: string;
    lat: number;
    lng: number;
    phone: string;
    whatsapp: string | null;
    email: string;
    website: string | null;
    tagline: string;
    description: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    scheduleJson: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    languages: string[];
    facilities: string[];
    diagnostics: string[];
    financing: boolean;
    financingNote: string | null;
    firstVisitFree: boolean;
    emergency24h: boolean;
    parking: boolean;
    accessible: boolean;
    status: ClinicStatus;
    verificationStatus: VerificationStatus;
    verifiedAt: Date | null;
    publishedAt: Date | null;
    externalRating: number | null;
    externalReviewCount: number;
    externalSource: string | null;
    internalRating: number | null;
    internalReviewCount: number;
    avgResponseMinutes: number | null;
    profileCompleteness: number;
    dentalRankScore: number;
    scoreComputedAt: Date | null;
  }[] = [];

  const clinicTreatmentRows: {
    id: string;
    clinicId: string;
    treatmentId: string;
    priceFromCents: number;
    priceNote: string | null;
    featured: boolean;
  }[] = [];

  const clinicImageRows: { id: string; clinicId: string; url: string; alt: string; order: number }[] = [];
  const teamMemberRows: {
    id: string;
    clinicId: string;
    name: string;
    role: string;
    collegiateNo: string | null;
    photoUrl: string | null;
    order: number;
  }[] = [];
  const reviewRows: {
    id: string;
    clinicId: string;
    authorName: string;
    rating: number;
    title: string;
    body: string;
    treatment: string | null;
    status: ReviewStatus;
    verifiedPatient: boolean;
    publishedAt: Date | null;
    createdAt: Date;
  }[] = [];

  const plans: ClinicPlan[] = [];

  for (const spec of orgSpecs) {
    let orgId = spec.isGroup ? orgIdByGroupName.get(spec.name) : undefined;
    if (!orgId) {
      orgId = randomUUID();
      const orgSlug = uniqueSlug(spec.name, usedOrgSlugs);
      organizationRows.push({
        id: orgId,
        name: spec.name,
        slug: orgSlug,
        legalName: `${spec.name} S.L.`,
        taxId: fakeCif(rng),
        billingEmail: `facturacion-${orgSlug}@dentalrank-demo.es`,
        phone: spanishLandline(rng),
      });
      if (spec.isGroup) orgIdByGroupName.set(spec.name, orgId);
    }

    const city = CITIES.find((c) => c.slug === spec.citySlug)!;
    const cityId = cityIdBySlug.get(city.slug)!;
    const clinicId = randomUUID();
    const clinicBaseName = spec.isGroup ? `${spec.name} — ${city.name}` : spec.name;
    const clinicSlug = uniqueSlug(`${clinicBaseName} ${city.name}`, usedClinicSlugs);

    // Estado: la mayoría publicadas.
    const status = weightedPick<ClinicStatus>(rng, [
      { value: "PUBLISHED", weight: 88 },
      { value: "DRAFT", weight: 6 },
      { value: "PENDING_REVIEW", weight: 4 },
      { value: "SUSPENDED", weight: 2 },
    ]);
    const verificationStatus = weightedPick<VerificationStatus>(rng, [
      { value: "VERIFIED", weight: 45 },
      { value: "UNVERIFIED", weight: 30 },
      { value: "PENDING", weight: 18 },
      { value: "REJECTED", weight: 7 },
    ]);

    // Tratamientos ofrecidos: 3 a 6, sesgados hacia la categoría "general".
    const treatmentCount = randInt(rng, 3, 6);
    const treatmentSlugs = pickN(rng, allTreatmentSlugs, treatmentCount);

    for (const tSlug of treatmentSlugs) {
      const range = treatmentPriceBySlug.get(tSlug)!;
      clinicTreatmentRows.push({
        id: randomUUID(),
        clinicId,
        treatmentId: treatmentIdBySlug.get(tSlug)!,
        priceFromCents: priceCents(rng, range.minCents, range.maxCents, range.maxCents > 100_000 ? 5_000 : 500),
        priceNote: chance(rng, 0.3) ? "IVA incluido" : null,
        featured: chance(rng, 0.25),
      });
    }

    const imageCount = weightedPick(rng, [
      { value: 0, weight: 15 },
      { value: 1, weight: 10 },
      { value: 2, weight: 15 },
      { value: 3, weight: 25 },
      { value: 4, weight: 20 },
      { value: 5, weight: 15 },
    ]);
    // Galería: se reparte el catálogo local de fotografía a partir de un
    // desplazamiento derivado del índice de la clínica, para que dos clínicas
    // seguidas no muestren las mismas escenas.
    const photoOffset = randInt(rng, 0, CLINIC_PHOTOS.length - 1);
    for (let i = 0; i < imageCount; i++) {
      const shot = CLINIC_PHOTOS[(photoOffset + i) % CLINIC_PHOTOS.length];
      clinicImageRows.push({
        id: randomUUID(),
        clinicId,
        url: shot.src,
        alt: shot.alt,
        order: i,
      });
    }

    const teamCount = weightedPick(rng, [
      { value: 0, weight: 15 },
      { value: 1, weight: 20 },
      { value: 2, weight: 25 },
      { value: 3, weight: 20 },
      { value: 4, weight: 15 },
      { value: 5, weight: 5 },
    ]);
    for (let i = 0; i < teamCount; i++) {
      const memberName = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)} ${pick(rng, LAST_NAMES)}`;
      teamMemberRows.push({
        id: randomUUID(),
        clinicId,
        name: memberName,
        role: i === 0 ? "Director/a médico" : pick(rng, TEAM_ROLES),
        collegiateNo: chance(rng, 0.6) ? `${randInt(rng, 8, 50)}/${randInt(rng, 1000, 9999)}` : null,
        photoUrl: chance(rng, 0.7) ? `https://i.pravatar.cc/300?u=${clinicSlug}-team-${i}` : null,
        order: i,
      });
    }

    // Reseñas internas.
    const reviewCount = weightedPick(rng, [
      { value: 0, weight: 10 },
      { value: 2, weight: 15 },
      { value: 4, weight: 25 },
      { value: 7, weight: 25 },
      { value: 12, weight: 20 },
      { value: 20, weight: 5 },
    ]);
    const reviewRatings: number[] = [];
    for (let i = 0; i < reviewCount; i++) {
      const rating = weightedPick(rng, [
        { value: 5, weight: 40 },
        { value: 4, weight: 30 },
        { value: 3, weight: 15 },
        { value: 2, weight: 10 },
        { value: 1, weight: 5 },
      ]);
      const reviewStatus = weightedPick<ReviewStatus>(rng, [
        { value: "PUBLISHED", weight: 80 },
        { value: "PENDING", weight: 15 },
        { value: "REJECTED", weight: 5 },
      ]);
      const createdAt = daysAgo(rng, now, 0, 180);
      const titlePool = rating >= 4 ? REVIEW_TITLES_POSITIVE : rating === 3 ? REVIEW_TITLES_NEUTRAL : REVIEW_TITLES_NEGATIVE;
      reviewRows.push({
        id: randomUUID(),
        clinicId,
        authorName: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)[0]}.`,
        rating,
        title: pick(rng, titlePool),
        body: pick(rng, REVIEW_BODIES),
        treatment: treatmentSlugs.length > 0 ? treatmentNameFromSlug(pick(rng, treatmentSlugs)) : null,
        status: reviewStatus,
        verifiedPatient: chance(rng, 0.6),
        publishedAt: reviewStatus === "PUBLISHED" ? createdAt : null,
        createdAt,
      });
      if (reviewStatus === "PUBLISHED") reviewRatings.push(rating);
    }

    const languages = ["es", ...pickN(rng, LANGUAGE_POOL.filter((l) => l !== "es"), randInt(rng, 0, 3))];
    const diagnostics = pickN(rng, DIAGNOSTIC_POOL, randInt(rng, 0, DIAGNOSTIC_POOL.length));
    const facilities = pickN(rng, FACILITY_POOL, randInt(rng, 0, 4));
    const hasSchedule = chance(rng, 0.85);
    const scheduleJson = hasSchedule ? buildSchedule(rng) : null;
    const hasDescription = chance(rng, 0.85);
    const categoryName = categorySlugByTreatmentSlug.get(treatmentSlugs[0] ?? "limpieza-dental") ?? "odontología general";
    const description = hasDescription
      ? pick(rng, DESCRIPTION_TEMPLATES)(clinicBaseName, city.name, categoryName.toLowerCase())
      : null;
    const hasLogo = chance(rng, 0.75);
    const hasCover = chance(rng, 0.6);

    const financing = chance(rng, 0.65);
    const externalReviewCount = weightedPick(rng, [
      { value: 0, weight: 10 },
      { value: randInt(rng, 5, 30), weight: 25 },
      { value: randInt(rng, 30, 100), weight: 35 },
      { value: randInt(rng, 100, 320), weight: 30 },
    ]);
    const externalRating = externalReviewCount > 0 ? randFloat(rng, 3.4, 5.0, 1) : null;

    const internalReviewCount = reviewRatings.length;
    const internalRating =
      internalReviewCount > 0
        ? Math.round((reviewRatings.reduce((s, r) => s + r, 0) / internalReviewCount) * 10) / 10
        : null;

    const avgResponseMinutes = status === "PUBLISHED" ? randInt(rng, 10, 1800) : null;

    const profileCompleteness = computeProfileCompleteness({
      description,
      logoUrl: hasLogo ? "logo" : null,
      coverUrl: hasCover ? "cover" : null,
      phone: "1",
      website: null,
      email: "a@a.com",
      scheduleJson,
      imageCount,
      treatmentCount: treatmentSlugs.length,
      teamCount,
      languages,
      diagnostics,
    });

    const { total: dentalRankScore } = computeDentalRankScore({
      verified: verificationStatus === "VERIFIED",
      profileCompleteness,
      externalRating,
      externalReviewCount,
      internalRating,
      internalReviewCount,
      avgResponseMinutes,
      treatmentCount: treatmentSlugs.length,
      hasPhotos: imageCount > 0,
      hasSchedule,
      hasTeam: teamCount > 0,
    });

    const publishedAt = status === "PUBLISHED" ? daysAgo(rng, now, 30, 500) : null;
    const verifiedAt = verificationStatus === "VERIFIED" ? daysAgo(rng, now, 5, 400) : null;

    const cityLatJitter = (rng() - 0.5) * 0.02;
    const cityLngJitter = (rng() - 0.5) * 0.02;

    clinicRows.push({
      id: clinicId,
      organizationId: orgId,
      name: clinicBaseName,
      slug: clinicSlug,
      legalName: `${clinicBaseName} S.L.`,
      taxId: fakeCif(rng),
      address: `${pick(rng, STREET_NAMES)}, ${randInt(rng, 1, 180)}`,
      postalCode: jitterPostalCode(rng, city.postalCode),
      cityId,
      lat: city.lat + cityLatJitter,
      lng: city.lng + cityLngJitter,
      phone: spanishLandline(rng),
      whatsapp: chance(rng, 0.7) ? spanishMobile(rng) : null,
      email: `info@${clinicSlug}.dentalrank-demo.es`,
      website: chance(rng, 0.55) ? `https://www.${clinicSlug}.es` : null,
      tagline: pick(rng, TAGLINES),
      description,
      logoUrl: null, // el logo lo aporta cada clínica desde su panel
      coverUrl: hasCover
        ? CLINIC_PHOTOS[randInt(rng, 0, CLINIC_PHOTOS.length - 1)].src
        : null,
      scheduleJson: (scheduleJson ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull,
      languages,
      facilities,
      diagnostics,
      financing,
      financingNote: financing ? pick(rng, FINANCING_NOTES) : null,
      firstVisitFree: chance(rng, 0.35),
      emergency24h: chance(rng, 0.15),
      parking: chance(rng, 0.4),
      accessible: chance(rng, 0.5),
      status,
      verificationStatus,
      verifiedAt,
      publishedAt,
      externalRating,
      externalReviewCount,
      externalSource: externalReviewCount > 0 ? DEMO_EXTERNAL_SOURCE : null,
      internalRating,
      internalReviewCount,
      avgResponseMinutes,
      profileCompleteness,
      dentalRankScore,
      scoreComputedAt: now,
    });

    plans.push({
      id: clinicId,
      organizationId: orgId,
      organizationSlug: organizationRows.find((o) => o.id === orgId)!.slug,
      slug: clinicSlug,
      name: clinicBaseName,
      citySlug: city.slug,
      cityId,
      status,
      verificationStatus,
      treatmentSlugs,
      imageCount,
      teamCount,
      reviewRatings,
      languages,
      diagnostics,
      scheduleJson,
      hasLogo,
      hasCover,
    });
  }

  await prisma.organization.createMany({ data: organizationRows });
  await prisma.clinic.createMany({ data: clinicRows });
  await prisma.clinicTreatment.createMany({ data: clinicTreatmentRows });
  if (clinicImageRows.length > 0) await prisma.clinicImage.createMany({ data: clinicImageRows });
  if (teamMemberRows.length > 0) await prisma.teamMember.createMany({ data: teamMemberRows });
  if (reviewRows.length > 0) await prisma.review.createMany({ data: reviewRows });

  // -------------------------------------------------------------------
  // 4. Usuarios: 1 SUPER_ADMIN + 1 CLINIC_ADMIN por organización
  // -------------------------------------------------------------------
  const userRows: { id: string; name: string; email: string; passwordHash: string; role: "SUPER_ADMIN" | "USER" }[] = [
    {
      id: randomUUID(),
      name: "Administrador DentalRank",
      email: "admin@dentalrank.es",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  ];
  const orgUserRows: { id: string; organizationId: string; userId: string; role: "CLINIC_ADMIN" }[] = [];
  const userIdByOrgId = new Map<string, string>();

  for (const org of organizationRows) {
    const userId = randomUUID();
    userRows.push({
      id: userId,
      name: `Administración ${org.name}`,
      email: `clinica-${org.slug}@dentalrank.es`,
      passwordHash,
      role: "USER",
    });
    orgUserRows.push({ id: randomUUID(), organizationId: org.id, userId, role: "CLINIC_ADMIN" });
    userIdByOrgId.set(org.id, userId);
  }
  await prisma.user.createMany({ data: userRows });
  await prisma.organizationUser.createMany({ data: orgUserRows });

  // -------------------------------------------------------------------
  // 5. Mercados de subasta (tratamiento × municipio) y pujas
  // -------------------------------------------------------------------
  type MarketPlan = { id: string; treatmentSlug: string; citySlug: string; clinicIds: string[] };
  const marketByKey = new Map<string, MarketPlan>();
  for (const plan of plans) {
    for (const tSlug of plan.treatmentSlugs) {
      const key = `${tSlug}|${plan.citySlug}`;
      let m = marketByKey.get(key);
      if (!m) {
        m = { id: randomUUID(), treatmentSlug: tSlug, citySlug: plan.citySlug, clinicIds: [] };
        marketByKey.set(key, m);
      }
      m.clinicIds.push(plan.id);
    }
  }

  const marketRows: {
    id: string;
    treatmentId: string;
    cityId: string;
    status: MarketStatus;
    pricingModel: PricingModel;
    minimumBidCents: number;
    bidIncrementCents: number;
    sponsoredSlots: number;
  }[] = [];
  const marketMeta = new Map<string, { pricingModel: PricingModel; minimumBidCents: number; bidIncrementCents: number }>();

  for (const m of marketByKey.values()) {
    const pricingModel = weightedPick<PricingModel>(rng, [
      { value: "BALANCE", weight: 70 },
      { value: "CPC", weight: 20 },
      { value: "CPL", weight: 10 },
    ]);
    const minimumBidCents = pricingModel === "BALANCE" ? priceCents(rng, 3_000, 15_000, 500) : 5_000;
    const bidIncrementCents = pricingModel === "BALANCE" ? priceCents(rng, 500, 2_000, 100) : 1_000;
    marketRows.push({
      id: m.id,
      treatmentId: treatmentIdBySlug.get(m.treatmentSlug)!,
      cityId: cityIdBySlug.get(m.citySlug)!,
      status: "ACTIVE",
      pricingModel,
      minimumBidCents,
      bidIncrementCents,
      sponsoredSlots: 3,
    });
    marketMeta.set(m.id, { pricingModel, minimumBidCents, bidIncrementCents });
  }
  await prisma.auctionMarket.createMany({ data: marketRows });

  const bidRows: {
    id: string;
    marketId: string;
    clinicId: string;
    amountCents: number;
    maxCpcCents: number | null;
    cplCents: number | null;
    status: BidStatus;
    reachedAmountAt: Date;
    spentCents: number;
  }[] = [];

  // Guardamos, por (mercado, clínica), la puja activa para usarla luego al generar clics/leads facturables.
  const activeBidByMarketClinic = new Map<string, { pricingModel: PricingModel; maxCpcCents: number | null; cplCents: number | null }>();

  for (const m of marketByKey.values()) {
    if (m.clinicIds.length < 2) continue; // solo mercados con competencia real
    const meta = marketMeta.get(m.id)!;
    const bidderCount = Math.min(m.clinicIds.length, randInt(rng, 2, 4));
    const bidders = pickN(rng, m.clinicIds, bidderCount);

    // Importes descendentes, forzando un empate entre el 2º y el 3º postor
    // (cuando existan) para poder comprobar el desempate por `reachedAmountAt`.
    const baseAmounts: number[] = [];
    let current = meta.minimumBidCents + meta.bidIncrementCents * randInt(rng, 3, 8);
    for (let i = 0; i < bidders.length; i++) {
      baseAmounts.push(current);
      current = Math.max(meta.minimumBidCents, current - meta.bidIncrementCents * randInt(rng, 1, 3));
    }
    if (baseAmounts.length >= 3) baseAmounts[2] = baseAmounts[1]; // empate 2º/3º

    bidders.forEach((clinicId, idx) => {
      const amountCents = baseAmounts[idx]!;
      const status = weightedPick<BidStatus>(rng, [
        { value: "ACTIVE", weight: 85 },
        { value: "PAUSED", weight: 10 },
        { value: "DEPLETED", weight: 5 },
      ]);
      // El desempate se hace más antiguo -> gana: escalonamos las marcas de
      // tiempo para que el postor con el mismo importe que llegó antes gane.
      const reachedAmountAt = daysAgo(rng, now, idx * 3, idx * 3 + 20);
      const maxCpcCents = meta.pricingModel === "CPC" ? priceCents(rng, 80, 400, 10) : null;
      const cplCents = meta.pricingModel === "CPL" ? priceCents(rng, 1_500, 6_000, 100) : null;

      bidRows.push({
        id: randomUUID(),
        marketId: m.id,
        clinicId,
        amountCents,
        maxCpcCents,
        cplCents,
        status,
        reachedAmountAt,
        spentCents: Math.round(amountCents * randFloat(rng, 0, 0.6, 2)),
      });

      if (status === "ACTIVE") {
        activeBidByMarketClinic.set(`${m.id}|${clinicId}`, { pricingModel: meta.pricingModel, maxCpcCents, cplCents });
      }
    });
  }
  if (bidRows.length > 0) await prisma.bid.createMany({ data: bidRows });

  // Recalcula y persiste las posiciones patrocinadas con la lógica real de producción.
  for (const m of marketRows) {
    await persistPositions(m.id);
  }

  // -------------------------------------------------------------------
  // 6. Clics y leads de los últimos 90 días
  // -------------------------------------------------------------------
  const clickRows: {
    id: string;
    clinicId: string;
    marketId: string | null;
    treatmentId: string | null;
    cityId: string | null;
    type: ClickType;
    position: number | null;
    sponsored: boolean;
    costCents: number;
    billed: boolean;
    valid: boolean;
    invalidReason: string | null;
    ipHash: string | null;
    userAgent: string;
    referrer: string | null;
    createdAt: Date;
  }[] = [];

  const leadRows: {
    id: string;
    clinicId: string;
    marketId: string | null;
    treatmentId: string | null;
    cityId: string;
    name: string;
    phone: string;
    email: string;
    postalCode: string | null;
    timePreference: string;
    comment: string | null;
    status: LeadStatus;
    quality: LeadQuality;
    source: LeadSource;
    priceCents: number;
    billed: boolean;
    assignedToId: string | null;
    lastContactAt: Date | null;
    closedAt: Date | null;
    lostReason: string | null;
    ipHash: string | null;
    userAgent: string;
    createdAt: Date;
  }[] = [];

  const leadEventRows: {
    id: string;
    leadId: string;
    type: LeadEventType;
    fromStatus: LeadStatus | null;
    toStatus: LeadStatus | null;
    message: string | null;
    userId: string | null;
    createdAt: Date;
  }[] = [];

  const consentRows: {
    id: string;
    leadId: string;
    type: ConsentType;
    granted: boolean;
    version: string;
    text: string;
    source: string;
    ipHash: string | null;
    userAgent: string;
    createdAt: Date;
  }[] = [];

  const walletTxByClinic = new Map<
    string,
    { id: string; type: LedgerEntryType; reason: LedgerReason; amountCents: number; reference: string; description: string; createdAt: Date }[]
  >();

  function addLedgerEvent(
    clinicId: string,
    type: LedgerEntryType,
    reason: LedgerReason,
    amountCents: number,
    reference: string,
    description: string,
    createdAt: Date,
  ) {
    const list = walletTxByClinic.get(clinicId) ?? [];
    list.push({ id: randomUUID(), type, reason, amountCents, reference, description, createdAt });
    walletTxByClinic.set(clinicId, list);
  }

  const FUNNEL: LeadStatus[] = ["NEW", "CONTACTED", "APPOINTMENT", "ATTENDED", "BUDGET", "ACCEPTED"];

  for (const plan of plans) {
    // Recarga(s) inicial(es) de saldo para todas las clínicas, incluso las no publicadas.
    const topUps = randInt(rng, 1, 3);
    for (let i = 0; i < topUps; i++) {
      const amountCents = priceCents(rng, 20_000, 150_000, 5_000);
      addLedgerEvent(
        plan.id,
        "CREDIT",
        "TOPUP",
        amountCents,
        `topup:${plan.id}:${i}`,
        "Recarga de saldo (demo)",
        daysAgo(rng, now, 90, 400),
      );
    }

    if (plan.status !== "PUBLISHED") continue; // solo las clínicas publicadas generan tráfico

    const assignedUserId = userIdByOrgId.get(plan.organizationId) ?? null;

    const clickCount = randInt(rng, 8, 45);
    for (let i = 0; i < clickCount; i++) {
      const createdAt = daysAgo(rng, now, 0, 90);
      const treatmentSlug = plan.treatmentSlugs.length > 0 ? pick(rng, plan.treatmentSlugs) : null;
      const marketKey = treatmentSlug ? `${treatmentSlug}|${plan.citySlug}` : null;
      const market = marketKey ? marketByKey.get(marketKey) : null;
      const activeBid = market ? activeBidByMarketClinic.get(`${market.id}|${plan.id}`) : undefined;
      const sponsored = Boolean(activeBid) && chance(rng, 0.5);
      const type = weightedPick<ClickType>(rng, [
        { value: "PROFILE", weight: 45 },
        { value: "PHONE", weight: 20 },
        { value: "WHATSAPP", weight: 15 },
        { value: "WEBSITE", weight: 10 },
        { value: "DIRECTIONS", weight: 5 },
        { value: "LEAD_FORM_OPEN", weight: 5 },
      ]);
      const valid = chance(rng, 0.94);
      const costCents =
        valid && sponsored && activeBid?.pricingModel === "CPC" && activeBid.maxCpcCents ? activeBid.maxCpcCents : 0;
      const fakeIp = `${pick(rng, DEMO_IP_RANGES)}.${randInt(rng, 1, 254)}`;

      const clickId = randomUUID();
      clickRows.push({
        id: clickId,
        clinicId: plan.id,
        marketId: sponsored ? (market?.id ?? null) : null,
        treatmentId: treatmentSlug ? (treatmentIdBySlug.get(treatmentSlug) ?? null) : null,
        cityId: plan.cityId,
        type,
        position: sponsored ? randInt(rng, 1, 3) : null,
        sponsored,
        costCents,
        billed: costCents > 0,
        valid,
        invalidReason: valid ? null : pick(rng, ["DUPLICATE_WINDOW", "BOT_SUSPECTED"]),
        ipHash: hashIp(fakeIp),
        userAgent: pick(rng, USER_AGENTS),
        referrer: pick(rng, REFERRERS),
        createdAt,
      });

      if (costCents > 0) {
        addLedgerEvent(plan.id, "DEBIT", "CLICK", costCents, `click:${clickId}`, "Clic patrocinado (demo)", createdAt);
      }
    }

    const leadCount = randInt(rng, 3, 18);
    for (let i = 0; i < leadCount; i++) {
      const createdAt = daysAgo(rng, now, 0, 90);
      const treatmentSlug = plan.treatmentSlugs.length > 0 ? pick(rng, plan.treatmentSlugs) : null;
      const marketKey = treatmentSlug ? `${treatmentSlug}|${plan.citySlug}` : null;
      const market = marketKey ? marketByKey.get(marketKey) : null;
      const activeBid = market ? activeBidByMarketClinic.get(`${market.id}|${plan.id}`) : undefined;

      const quality = weightedPick<LeadQuality>(rng, [
        { value: "VALID", weight: 40 },
        { value: "UNREVIEWED", weight: 35 },
        { value: "DUPLICATE", weight: 10 },
        { value: "INVALID", weight: 8 },
        { value: "SPAM", weight: 7 },
      ]);
      const billableLead = quality !== "DUPLICATE" && quality !== "SPAM";
      const priceCentsForLead =
        billableLead && activeBid?.pricingModel === "CPL" && activeBid.cplCents ? activeBid.cplCents : 0;

      // Progreso en el embudo: cuanto más adelante, menos frecuente (excepto LOST).
      const terminal = weightedPick<LeadStatus | "LOST">(rng, [
        { value: "NEW", weight: 25 },
        { value: "CONTACTED", weight: 20 },
        { value: "APPOINTMENT", weight: 15 },
        { value: "ATTENDED", weight: 10 },
        { value: "BUDGET", weight: 8 },
        { value: "ACCEPTED", weight: 12 },
        { value: "LOST", weight: 10 },
      ]);

      const leadId = randomUUID();
      const source = weightedPick<LeadSource>(rng, [
        { value: "SEARCH_RESULTS", weight: 40 },
        { value: "CLINIC_PROFILE", weight: 30 },
        { value: "CITY_PAGE", weight: 15 },
        { value: "HOMEPAGE", weight: 10 },
        { value: "DIRECT", weight: 4 },
        { value: "IMPORT", weight: 1 },
      ]);
      const fakeIp = `${pick(rng, DEMO_IP_RANGES)}.${randInt(rng, 1, 254)}`;
      const ipHashValue = hashIp(fakeIp);
      const userAgent = pick(rng, USER_AGENTS);

      let cursor = createdAt;
      let status: LeadStatus = "NEW";
      leadEventRows.push({
        id: randomUUID(),
        leadId,
        type: "CREATED",
        fromStatus: null,
        toStatus: "NEW",
        message: null,
        userId: null,
        createdAt: cursor,
      });

      let lastContactAt: Date | null = null;
      let closedAt: Date | null = null;
      let lostReason: string | null = null;

      if (terminal === "LOST") {
        // Puede perderse tras algún contacto o directamente desde NEW.
        const stepsBeforeLoss = randInt(rng, 0, 2);
        for (let s = 0; s < stepsBeforeLoss; s++) {
          const from = status;
          status = FUNNEL[Math.min(FUNNEL.indexOf(status) + 1, FUNNEL.length - 1)]!;
          cursor = new Date(cursor.getTime() + randInt(rng, 2, 48) * 60 * 60 * 1000);
          if (cursor > now) cursor = now;
          leadEventRows.push({
            id: randomUUID(),
            leadId,
            type: "STATUS_CHANGED",
            fromStatus: from,
            toStatus: status,
            message: null,
            userId: assignedUserId,
            createdAt: cursor,
          });
          lastContactAt = cursor;
        }
        cursor = new Date(cursor.getTime() + randInt(rng, 2, 72) * 60 * 60 * 1000);
        if (cursor > now) cursor = now;
        leadEventRows.push({
          id: randomUUID(),
          leadId,
          type: "STATUS_CHANGED",
          fromStatus: status,
          toStatus: "LOST",
          message: pick(rng, LOST_REASONS),
          userId: assignedUserId,
          createdAt: cursor,
        });
        status = "LOST";
        closedAt = cursor;
        lostReason = pick(rng, LOST_REASONS);
      } else {
        const targetIdx = FUNNEL.indexOf(terminal);
        for (let s = 1; s <= targetIdx; s++) {
          const from = status;
          status = FUNNEL[s]!;
          cursor = new Date(cursor.getTime() + randInt(rng, 2, 48) * 60 * 60 * 1000);
          if (cursor > now) cursor = now;
          leadEventRows.push({
            id: randomUUID(),
            leadId,
            type: "STATUS_CHANGED",
            fromStatus: from,
            toStatus: status,
            message: null,
            userId: assignedUserId,
            createdAt: cursor,
          });
          lastContactAt = cursor;
        }
        if (status === "ACCEPTED") closedAt = cursor;
      }

      leadRows.push({
        id: leadId,
        clinicId: plan.id,
        marketId: market?.id ?? null,
        treatmentId: treatmentSlug ? (treatmentIdBySlug.get(treatmentSlug) ?? null) : null,
        cityId: plan.cityId,
        name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
        phone: spanishMobile(rng),
        email: `paciente${randInt(rng, 1000, 999999)}@correo-demo.es`,
        postalCode: jitterPostalCode(rng, CITIES.find((c) => c.slug === plan.citySlug)!.postalCode),
        timePreference: pick(rng, ["MORNING", "AFTERNOON", "ANY"]),
        comment: chance(rng, 0.4) ? "Me gustaría una primera valoración lo antes posible." : null,
        status,
        quality,
        source,
        priceCents: priceCentsForLead,
        billed: priceCentsForLead > 0,
        assignedToId: status === "NEW" ? null : assignedUserId,
        lastContactAt,
        closedAt,
        lostReason,
        ipHash: ipHashValue,
        userAgent,
        createdAt,
      });

      consentRows.push({
        id: randomUUID(),
        leadId,
        type: "DATA_SHARING",
        granted: true,
        version: CONSENT_VERSION,
        text: CONSENT_TEXTS.DATA_SHARING,
        source,
        ipHash: ipHashValue,
        userAgent,
        createdAt,
      });
      consentRows.push({
        id: randomUUID(),
        leadId,
        type: "MARKETING",
        granted: chance(rng, 0.4),
        version: CONSENT_VERSION,
        text: CONSENT_TEXTS.MARKETING,
        source,
        ipHash: ipHashValue,
        userAgent,
        createdAt,
      });

      if (priceCentsForLead > 0) {
        addLedgerEvent(plan.id, "DEBIT", "LEAD", priceCentsForLead, `lead:${leadId}`, "Lead válido recibido (demo)", createdAt);
      }
    }
  }

  if (clickRows.length > 0) await prisma.click.createMany({ data: clickRows });
  if (leadRows.length > 0) await prisma.lead.createMany({ data: leadRows });
  if (leadEventRows.length > 0) await prisma.leadEvent.createMany({ data: leadEventRows });
  if (consentRows.length > 0) await prisma.consent.createMany({ data: consentRows });

  // Compromiso inicial de las pujas activas en mercados BALANCE: se debita del
  // saldo el importe comprometido (modelo A).
  for (const bid of bidRows) {
    if (bid.status !== "ACTIVE") continue;
    const meta = marketMeta.get(bid.marketId)!;
    if (meta.pricingModel !== "BALANCE" || bid.amountCents <= 0) continue;
    addLedgerEvent(
      bid.clinicId,
      "DEBIT",
      "SPONSORSHIP",
      bid.amountCents,
      `bid:${bid.id}:commit`,
      "Compromiso de puja en posición patrocinada (demo)",
      bid.reachedAmountAt,
    );
  }

  // -------------------------------------------------------------------
  // 7. Wallets y ledger: se calcula el encadenado de saldos en memoria y se
  //    inserta ya coherente, para que balanceCents == suma(WalletTransaction).
  // -------------------------------------------------------------------
  const walletRows: { id: string; clinicId: string; balanceCents: number; lowBalanceThresholdCents: number }[] = [];
  const walletTransactionRows: {
    id: string;
    clinicId: string;
    type: LedgerEntryType;
    reason: LedgerReason;
    amountCents: number;
    balanceAfterCents: number;
    reference: string;
    idempotencyKey: string;
    description: string;
    createdAt: Date;
  }[] = [];

  for (const plan of plans) {
    const events = (walletTxByClinic.get(plan.id) ?? []).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    let balance = 0;
    for (const ev of events) {
      let delta = ev.type === "DEBIT" ? -Math.abs(ev.amountCents) : Math.abs(ev.amountCents);
      // El saldo de una clínica de demo nunca debe quedar en negativo: si el
      // gasto simulado supera lo recargado, el débito se recorta al saldo
      // disponible (y se descarta si ya no queda nada que debitar). El
      // importe insertado es SIEMPRE el delta realmente aplicado, para que
      // balanceCents seguido siga siendo exactamente la suma del ledger.
      if (delta < 0 && balance + delta < 0) {
        delta = -balance;
        if (delta === 0) continue;
      }
      balance += delta;
      walletTransactionRows.push({
        id: ev.id,
        clinicId: plan.id,
        type: ev.type,
        reason: ev.reason,
        amountCents: delta,
        balanceAfterCents: balance,
        reference: ev.reference,
        idempotencyKey: ev.reference,
        description: ev.description,
        createdAt: ev.createdAt,
      });
    }
    walletRows.push({
      id: randomUUID(),
      clinicId: plan.id,
      balanceCents: balance,
      lowBalanceThresholdCents: 5_000,
    });
  }

  await prisma.wallet.createMany({ data: walletRows });
  if (walletTransactionRows.length > 0) await prisma.walletTransaction.createMany({ data: walletTransactionRows });

  return {
    alreadySeeded: false,
    regions: regionRows.length,
    provinces: provinceRows.length,
    cities: cityRows.length,
    categories: categoryRows.length,
    treatments: treatmentRows.length,
    organizations: organizationRows.length,
    clinics: clinicRows.length,
    clinicTreatments: clinicTreatmentRows.length,
    markets: marketRows.length,
    bids: bidRows.length,
    wallets: walletRows.length,
    walletTransactions: walletTransactionRows.length,
    clicks: clickRows.length,
    leads: leadRows.length,
    reviews: reviewRows.length,
    users: userRows.length,
  };
}

// ---------------------------------------------------------------------------
// Reinicio y resumen de idempotencia
// ---------------------------------------------------------------------------

async function resetDemoData(): Promise<void> {
  // Orden de borrado respetando las dependencias de clave foránea (hijos primero).
  await prisma.leadEvent.deleteMany({});
  await prisma.leadNote.deleteMany({});
  await prisma.consent.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.click.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.walletTransaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.clinicBudget.deleteMany({});
  await prisma.sponsoredPosition.deleteMany({});
  await prisma.bidHistory.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.auctionMarket.deleteMany({});
  await prisma.clinicTreatment.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.clinicImage.deleteMany({});
  await prisma.clinic.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.organizationUser.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.treatment.deleteMany({});
  await prisma.treatmentCategory.deleteMany({});
  await prisma.neighborhood.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.province.deleteMany({});
  await prisma.region.deleteMany({});

  // Solo se borran los usuarios de demo (email @dentalrank.es), nunca cuentas
  // reales que puedan existir en el mismo entorno con otro dominio de correo.
  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: "@dentalrank.es" } },
    select: { id: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);
  if (demoUserIds.length > 0) {
    await prisma.session.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: demoUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } });
  }
}

async function summarizeExisting(): Promise<SeedSummary> {
  const [
    regions,
    provinces,
    cities,
    categories,
    treatments,
    organizations,
    clinics,
    clinicTreatments,
    markets,
    bids,
    wallets,
    walletTransactions,
    clicks,
    leads,
    reviews,
    users,
  ] = await Promise.all([
    prisma.region.count(),
    prisma.province.count(),
    prisma.city.count(),
    prisma.treatmentCategory.count(),
    prisma.treatment.count(),
    prisma.organization.count(),
    prisma.clinic.count(),
    prisma.clinicTreatment.count(),
    prisma.auctionMarket.count(),
    prisma.bid.count(),
    prisma.wallet.count(),
    prisma.walletTransaction.count(),
    prisma.click.count(),
    prisma.lead.count(),
    prisma.review.count(),
    prisma.user.count({ where: { email: { endsWith: "@dentalrank.es" } } }),
  ]);

  return {
    alreadySeeded: true,
    regions,
    provinces,
    cities,
    categories,
    treatments,
    organizations,
    clinics,
    clinicTreatments,
    markets,
    bids,
    wallets,
    walletTransactions,
    clicks,
    leads,
    reviews,
    users,
  };
}

// ---------------------------------------------------------------------------
// Helpers de generación de datos ficticios
// ---------------------------------------------------------------------------

function daysAgo(rng: Rng, now: Date, minDays: number, maxDays: number): Date {
  const days = randFloat(rng, minDays, maxDays, 4);
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/** Teléfono fijo español ficticio, formato válido (9 dígitos, prefijo 8 o 9). */
function spanishLandline(rng: Rng): string {
  const prefix = pick(rng, [91, 93, 94, 95, 96, 97, 98]);
  const rest = String(randInt(rng, 0, 9999999)).padStart(7, "0");
  return `${prefix}${rest}`.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

/** Móvil español ficticio, formato válido (empieza por 6 o 7). */
function spanishMobile(rng: Rng): string {
  const first = pick(rng, [6, 7]);
  const rest = String(randInt(rng, 0, 99999999)).padStart(8, "0");
  return `+34 ${first}${rest}`.replace(/(\+34 \d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

/** CIF ficticio con formato válido (letra + 8 dígitos). No se valida el dígito de control. */
function fakeCif(rng: Rng): string {
  const letter = pick(rng, ["B", "A", "G"]);
  const digits = String(randInt(rng, 10_000_000, 99_999_999));
  return `${letter}${digits}`;
}

function jitterPostalCode(rng: Rng, base: string): string {
  const prefix = base.slice(0, 2);
  const suffix = String(randInt(rng, 0, 99)).padStart(3, "0");
  return `${prefix}${suffix}`;
}

function buildSchedule(rng: Rng): Record<string, [string, string][]> {
  const morning: [string, string] = ["09:00", "13:30"];
  const afternoon: [string, string] = ["16:00", "20:00"];
  const satMorning: [string, string] = ["09:30", "13:00"];
  const weekday = chance(rng, 0.7) ? [morning, afternoon] : [["09:00", "18:00"] as [string, string]];
  return {
    mon: weekday,
    tue: weekday,
    wed: weekday,
    thu: weekday,
    fri: weekday,
    sat: chance(rng, 0.4) ? [satMorning] : [],
    sun: [],
  };
}

function treatmentNameFromSlug(slug: string): string {
  for (const cat of CATEGORIES) {
    const found = cat.treatments.find((t) => t.slug === slug);
    if (found) return found.name;
  }
  return slug;
}
