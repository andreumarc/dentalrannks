/**
 * Interpretación de una búsqueda libre.
 *
 * El buscador de DentalRank no es un buscador de texto: es un enrutador. La
 * gente escribe «implantes barcelona» o «dentista igualada», y lo valioso no
 * es devolver una lista de coincidencias, sino llevarla a la página que ya
 * responde esa consulta: la combinación tratamiento×municipio.
 *
 * Este módulo es pura lógica y no toca la base de datos, para poder probarlo.
 */

/** Palabras que la gente escribe pero no aportan al enrutado. */
const VACIAS = new Set([
  "en", "de", "del", "la", "el", "los", "las", "un", "una", "para", "por",
  "cerca", "cercano", "cercana", "mi", "me", "que", "con", "y", "o", "a",
  "mejor", "mejores", "buen", "buena", "barato", "barata", "baratos", "baratas",
  "precio", "precios", "coste", "cuesta", "cuanto", "cuánto",
  "clinica", "clinicas", "centro", "centros",
]);

/** Términos que expresan «quiero un dentista», sin tratamiento concreto. */
const GENERICOS = new Set(["dentista", "dentistas", "dental", "dentales", "odontologo", "odontologa"]);

/** Minúsculas, sin acentos y sin puntuación. Los slugs ya vienen así. */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  return normalize(input).split(" ").filter(Boolean);
}

export type CatalogEntry = {
  slug: string;
  name: string;
  /** Formas alternativas con las que la gente lo busca. */
  aliases?: string[];
};

export type EntityMatch = {
  slug: string;
  name: string;
  /** Término del catálogo que ha coincidido, ya normalizado. */
  matchedTerm: string;
  /** Palabras de la consulta que ha consumido la coincidencia. */
  matchedWords: string[];
  /** Un término más largo es más específico y gana. */
  words: number;
  exact: boolean;
};

/**
 * Formas de una palabra que consideramos equivalentes.
 *
 * En español el plural añade «-s» tras vocal («implante» → «implantes») y
 * «-es» tras consonante («dental» → «dentales»). No se sabe cuál aplica sin un
 * diccionario, así que se generan ambas y basta con que coincida una: al
 * comparar solo contra un catálogo cerrado de tratamientos y municipios, el
 * riesgo de falso positivo es despreciable.
 */
export function wordForms(word: string): Set<string> {
  const formas = new Set([word]);
  if (word.length > 4 && word.endsWith("es")) formas.add(word.slice(0, -2));
  if (word.length > 3 && word.endsWith("s")) formas.add(word.slice(0, -1));
  return formas;
}

function sameWord(a: string, b: string): boolean {
  if (a === b) return true;
  const fa = wordForms(a);
  for (const f of wordForms(b)) if (fa.has(f)) return true;
  return false;
}

/**
 * Busca la entrada del catálogo cuyo nombre o alias aparezca en la consulta.
 *
 * La comparación es por secuencia de palabras completas, nunca por subcadena:
 * así «carilla» no se activa dentro de «maravilla» ni «all» dentro de
 * «allanamiento». Gana el término más largo, para que «ortodoncia invisible»
 * se imponga a «ortodoncia» y «San Sebastián de los Reyes» a «San Sebastián».
 */
export function matchCatalog(query: string, catalog: CatalogEntry[]): EntityMatch | null {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return null;

  let best: EntityMatch | null = null;

  for (const entry of catalog) {
    const terms = [entry.name, entry.slug.replace(/-/g, " "), ...(entry.aliases ?? [])];
    for (const raw of terms) {
      const termTokens = tokenize(raw);
      if (termTokens.length === 0 || termTokens.length > queryTokens.length) continue;

      for (let i = 0; i + termTokens.length <= queryTokens.length; i++) {
        const ventana = queryTokens.slice(i, i + termTokens.length);
        if (!ventana.every((w, j) => sameWord(w, termTokens[j]))) continue;

        const candidate: EntityMatch = {
          slug: entry.slug,
          name: entry.name,
          matchedTerm: termTokens.join(" "),
          matchedWords: ventana,
          words: termTokens.length,
          exact: termTokens.length === queryTokens.length,
        };
        if (
          !best ||
          (candidate.exact && !best.exact) ||
          (candidate.exact === best.exact && candidate.words > best.words)
        ) {
          best = candidate;
        }
        break;
      }
    }
  }

  return best;
}

export type QueryIntent = {
  /** Consulta original, tal cual la escribió la persona. */
  raw: string;
  normalized: string;
  treatment: EntityMatch | null;
  city: EntityMatch | null;
  /** La consulta pide «dentista» sin concretar tratamiento. */
  generic: boolean;
  /** Lo que queda tras quitar tratamiento, municipio y palabras vacías. */
  rest: string[];
};

/** Descompone la consulta en tratamiento, municipio y resto. */
export function parseQuery(
  raw: string,
  treatments: CatalogEntry[],
  cities: CatalogEntry[],
): QueryIntent {
  const normalized = normalize(raw);
  const treatment = matchCatalog(normalized, treatments);
  const city = matchCatalog(normalized, cities);

  const consumidas = new Set<string>();
  for (const m of [treatment, city]) {
    if (m) for (const w of m.matchedWords) consumidas.add(w);
  }

  const tokens = tokenize(normalized);
  const generic = tokens.some((t) => GENERICOS.has(t));

  const rest = tokens.filter(
    (t) => !consumidas.has(t) && !VACIAS.has(t) && !GENERICOS.has(t),
  );

  return { raw, normalized, treatment, city, generic, rest };
}

/**
 * Qué página responde mejor a la consulta.
 * `null` significa que no hay una respuesta directa y toca enseñar resultados.
 */
export function routeFor(intent: QueryIntent):
  | { kind: "combo"; treatment: string; city: string }
  | { kind: "city"; city: string }
  | { kind: "treatment"; treatment: string }
  | null {
  if (intent.treatment && intent.city) {
    return { kind: "combo", treatment: intent.treatment.slug, city: intent.city.slug };
  }
  if (intent.city) return { kind: "city", city: intent.city.slug };
  if (intent.treatment) return { kind: "treatment", treatment: intent.treatment.slug };
  return null;
}
