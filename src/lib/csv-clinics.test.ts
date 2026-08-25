import { describe, it, expect } from "vitest";
import { parseClinicsCsv, CSV_HEADERS } from "./csv-clinics";

const HEAD = CSV_HEADERS.join(",");
const OK = `${HEAD}\nDCdent,https://dcdent.example,"Carrer de Santa Caterina, 18",08700,Igualada,Barcelona,938037699,41.580573,1.615225`;

describe("parseClinicsCsv", () => {
  it("acepta una fila completa y normaliza el teléfono", () => {
    const { rows, headerError } = parseClinicsCsv(OK);
    expect(headerError).toBeNull();
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].data?.phone).toBe("938037699");
    expect(rows[0].data?.city).toBe("Igualada");
  });

  it("respeta las comas dentro de comillas", () => {
    const { rows } = parseClinicsCsv(OK);
    expect(rows[0].data?.address).toBe("Carrer de Santa Caterina, 18");
  });

  it("quita el prefijo 34 de un teléfono internacional", () => {
    const csv = OK.replace("938037699", "+34 938 03 76 99");
    expect(parseClinicsCsv(csv).rows[0].data?.phone).toBe("938037699");
  });

  it("rechaza código postal, teléfono y coordenadas fuera de rango", () => {
    const csv = `${HEAD}\nX,,Calle 1,870,Igualada,Barcelona,12345,60,1.6`;
    const errors = parseClinicsCsv(csv).rows[0].errors;
    expect(errors).toContain("El código postal debe tener 5 dígitos.");
    expect(errors).toContain("Teléfono no válido.");
    expect(errors).toContain("Latitud fuera de rango para España.");
  });

  it("avisa si falta una columna en la cabecera", () => {
    const { headerError } = parseClinicsCsv("name,address\nX,Calle 1");
    expect(headerError).toContain("Faltan columnas");
  });
});
