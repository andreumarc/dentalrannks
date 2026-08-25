import { describe, expect, it } from "vitest";
import { formatCents, formatCentsCompact, cpl, cpc, percent, eurosToCents } from "./money";

describe("formatCents", () => {
  it("formatea céntimos como euros en formato español", () => {
    // Intl.NumberFormat("es-ES") usa el símbolo € pospuesto y coma decimal.
    expect(formatCents(150_00)).toBe("150,00 €");
    expect(formatCents(999)).toBe("9,99 €");
    expect(formatCents(0)).toBe("0,00 €");
  });
});

describe("formatCentsCompact", () => {
  it("omite los decimales cuando el importe es un número redondo de euros", () => {
    expect(formatCentsCompact(5000)).toBe("50 €");
  });

  it("mantiene los decimales cuando el importe no es un número redondo", () => {
    expect(formatCentsCompact(5050)).toBe("50,50 €");
  });
});

describe("cpl / cpc", () => {
  it("cpl devuelve null cuando no hay leads (evita dividir entre cero)", () => {
    expect(cpl(10_000, 0)).toBeNull();
    expect(cpl(10_000, -1)).toBeNull();
  });

  it("cpl calcula el coste por lead redondeado", () => {
    expect(cpl(10_000, 4)).toBe(2_500);
    expect(cpl(10_001, 3)).toBe(Math.round(10_001 / 3));
  });

  it("cpc devuelve null cuando no hay clics (evita dividir entre cero)", () => {
    expect(cpc(5_000, 0)).toBeNull();
  });

  it("cpc calcula el coste por clic redondeado", () => {
    expect(cpc(1_000, 3)).toBe(Math.round(1_000 / 3));
  });
});

describe("percent", () => {
  it("devuelve 0 cuando el total es cero o negativo (evita dividir entre cero)", () => {
    expect(percent(5, 0)).toBe(0);
    expect(percent(5, -10)).toBe(0);
  });

  it("calcula el porcentaje redondeado a un decimal", () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(50, 200)).toBe(25);
  });
});

describe("eurosToCents", () => {
  it("convierte euros a céntimos redondeando al entero más cercano", () => {
    expect(eurosToCents(10)).toBe(1_000);
    expect(eurosToCents(10.005)).toBe(1_001); // 1000.5 -> redondeo estándar hacia arriba
    expect(eurosToCents(0.1)).toBe(10);
  });

  it("redondea correctamente evitando errores de coma flotante", () => {
    // 19.99 € en binario no es exacto; el resultado debe ser 1999 céntimos, no 1998.
    expect(eurosToCents(19.99)).toBe(1_999);
  });
});
