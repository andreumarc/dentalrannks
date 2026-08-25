import { describe, expect, it } from "vitest";
import { normalize, matchCatalog, parseQuery, routeFor } from "./search-parse";

const TRATAMIENTOS = [
  { slug: "implantes", name: "Implante unitario", aliases: ["implantes", "implante dental", "implantes dentales"] },
  { slug: "ortodoncia-invisible", name: "Ortodoncia invisible", aliases: ["ortodoncia invisible"] },
  { slug: "brackets", name: "Brackets", aliases: ["brackets", "ortodoncia"] },
  { slug: "all-on-4", name: "All-on-4", aliases: ["all on 4"] },
  { slug: "carillas", name: "Carillas", aliases: ["carillas", "carilla"] },
];

const CIUDADES = [
  { slug: "barcelona", name: "Barcelona" },
  { slug: "malaga", name: "Málaga" },
  { slug: "igualada", name: "Igualada" },
  { slug: "san-sebastian", name: "San Sebastián" },
  { slug: "san-sebastian-de-los-reyes", name: "San Sebastián de los Reyes" },
];

describe("normalize", () => {
  it("quita acentos, puntuación y mayúsculas", () => {
    expect(normalize("  Implantes  DENTALES, Málaga! ")).toBe("implantes dentales malaga");
  });
  it("devuelve cadena vacía si no queda nada", () => {
    expect(normalize("¿¡...!?")).toBe("");
  });
});

describe("matchCatalog", () => {
  it("encuentra el municipio aunque se escriba sin acento", () => {
    expect(matchCatalog("dentista malaga", CIUDADES)?.slug).toBe("malaga");
  });

  it("prefiere el término más largo y específico", () => {
    expect(matchCatalog("ortodoncia invisible barcelona", TRATAMIENTOS)?.slug).toBe(
      "ortodoncia-invisible",
    );
    expect(matchCatalog("dentista san sebastian de los reyes", CIUDADES)?.slug).toBe(
      "san-sebastian-de-los-reyes",
    );
  });

  it("no coincide con fragmentos de palabra", () => {
    // "carilla" no debe activarse dentro de "carillada" ni "all" dentro de "allanamiento"
    expect(matchCatalog("allanamiento", TRATAMIENTOS)).toBeNull();
    expect(matchCatalog("maravilla", TRATAMIENTOS)).toBeNull();
  });

  it("reconoce el slug escrito con espacios", () => {
    expect(matchCatalog("all on 4 barcelona", TRATAMIENTOS)?.slug).toBe("all-on-4");
  });

  it("devuelve null cuando no hay nada que reconocer", () => {
    expect(matchCatalog("hola que tal", CIUDADES)).toBeNull();
  });
});

describe("parseQuery", () => {
  it("separa tratamiento y municipio", () => {
    const intent = parseQuery("implantes dentales en Barcelona", TRATAMIENTOS, CIUDADES);
    expect(intent.treatment?.slug).toBe("implantes");
    expect(intent.city?.slug).toBe("barcelona");
    expect(intent.rest).toEqual([]);
  });

  it("detecta la intención genérica de dentista", () => {
    const intent = parseQuery("dentista en Igualada", TRATAMIENTOS, CIUDADES);
    expect(intent.generic).toBe(true);
    expect(intent.city?.slug).toBe("igualada");
    expect(intent.treatment).toBeNull();
  });

  it("descarta palabras vacías y de precio", () => {
    const intent = parseQuery("cuanto cuesta el mejor implante barato", TRATAMIENTOS, CIUDADES);
    expect(intent.treatment?.slug).toBe("implantes");
    expect(intent.rest).toEqual([]);
  });

  it("deja en rest lo que no reconoce, para poder buscar clínicas por nombre", () => {
    const intent = parseQuery("Clínica Sonrisa Diagonal", TRATAMIENTOS, CIUDADES);
    expect(intent.rest).toEqual(["sonrisa", "diagonal"]);
  });
});

describe("routeFor", () => {
  const ruta = (q: string) => routeFor(parseQuery(q, TRATAMIENTOS, CIUDADES));

  it("lleva a la combinación cuando hay tratamiento y municipio", () => {
    expect(ruta("carillas malaga")).toEqual({
      kind: "combo",
      treatment: "carillas",
      city: "malaga",
    });
  });

  it("lleva al municipio cuando solo hay municipio", () => {
    expect(ruta("dentistas igualada")).toEqual({ kind: "city", city: "igualada" });
  });

  it("lleva al tratamiento cuando solo hay tratamiento", () => {
    expect(ruta("brackets")).toEqual({ kind: "treatment", treatment: "brackets" });
  });

  it("no enruta lo que no reconoce", () => {
    expect(ruta("sonrisa diagonal")).toBeNull();
  });
});
