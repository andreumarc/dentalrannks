import { describe, expect, it } from "vitest";
import { slugify, truncate, initials } from "./utils";

describe("slugify", () => {
  it("elimina acentos y convierte a minúsculas", () => {
    expect(slugify("Clínica Dental Águila")).toBe("clinica-dental-aguila");
  });

  it("convierte la eñe correctamente", () => {
    expect(slugify("Peña de Baño Español")).toBe("pena-de-bano-espanol");
  });

  it("sustituye caracteres no alfanuméricos por guiones y recorta los extremos", () => {
    expect(slugify("  ¡Hola, Mundo!  ")).toBe("hola-mundo");
  });

  it("colapsa separadores repetidos en un único guion", () => {
    expect(slugify("A   B---C")).toBe("a-b-c");
  });
});

describe("truncate", () => {
  it("no modifica un texto más corto que el máximo", () => {
    expect(truncate("Hola", 10)).toBe("Hola");
  });

  it("trunca y añade puntos suspensivos cuando el texto excede el máximo", () => {
    const result = truncate("Este es un texto bastante largo", 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("initials", () => {
  it("toma la inicial de las dos primeras palabras", () => {
    expect(initials("Ana García López")).toBe("AG");
  });

  it("funciona con un solo nombre", () => {
    expect(initials("Ana")).toBe("A");
  });

  it("ignora espacios repetidos", () => {
    expect(initials("  Ana   García  ")).toBe("AG");
  });
});
