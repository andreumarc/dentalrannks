import { describe, expect, it } from "vitest";
import { normalizePhone, normalizeEmail, hashIp } from "./hash";

describe("normalizePhone", () => {
  it("normaliza un teléfono sin prefijo internacional", () => {
    expect(normalizePhone("612345678")).toBe("612345678");
  });

  it("normaliza un teléfono con prefijo +34", () => {
    expect(normalizePhone("+34612345678")).toBe("612345678");
  });

  it("normaliza un teléfono con prefijo 0034", () => {
    expect(normalizePhone("0034612345678")).toBe("612345678");
  });

  it("elimina espacios y guiones antes de normalizar", () => {
    expect(normalizePhone("+34 612-345 678")).toBe("612345678");
    expect(normalizePhone("612 345 678")).toBe("612345678");
  });

  it("dos formatos distintos del mismo número producen el mismo resultado (detección de duplicados)", () => {
    expect(normalizePhone("+34 612 345 678")).toBe(normalizePhone("612345678"));
  });
});

describe("normalizeEmail", () => {
  it("pasa el email a minúsculas y recorta espacios", () => {
    expect(normalizeEmail("  Ana@Example.COM  ")).toBe("ana@example.com");
  });

  it("no altera un email ya normalizado", () => {
    expect(normalizeEmail("ana@example.com")).toBe("ana@example.com");
  });
});

describe("hashIp", () => {
  it("devuelve null para una IP nula o indefinida", () => {
    expect(hashIp(null)).toBeNull();
    expect(hashIp(undefined)).toBeNull();
  });

  it("es determinista: la misma IP produce siempre el mismo hash", () => {
    expect(hashIp("203.0.113.5")).toBe(hashIp("203.0.113.5"));
  });

  it("IPs distintas producen hashes distintos", () => {
    expect(hashIp("203.0.113.5")).not.toBe(hashIp("203.0.113.6"));
  });

  it("no devuelve la IP en claro dentro del hash", () => {
    const hash = hashIp("203.0.113.5")!;
    expect(hash).not.toContain("203.0.113.5");
  });
});
