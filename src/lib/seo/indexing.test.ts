import { describe, expect, it } from "vitest";
import {
  MIN_CLINICS_FOR_INDEX,
  decideComboIndexing,
  comboShouldBe404,
  decideCityIndexing,
  decideClinicIndexing,
  decideTreatmentIndexing,
  decideStaticIndexing,
} from "./indexing";

describe("MIN_CLINICS_FOR_INDEX", () => {
  it("es 3", () => {
    expect(MIN_CLINICS_FOR_INDEX).toBe(3);
  });
});

describe("decideComboIndexing", () => {
  it("con 0 clínicas: no indexa (la página, además, debe devolver 404 — ver comboShouldBe404)", () => {
    const decision = decideComboIndexing(0);
    expect(decision.index).toBe(false);
    expect(decision.follow).toBe(true);
  });

  it("con 1 clínica: noindex, follow", () => {
    const decision = decideComboIndexing(1);
    expect(decision.index).toBe(false);
    expect(decision.follow).toBe(true);
    expect(decision.reason).toBeTruthy();
  });

  it("con 2 clínicas: noindex, follow", () => {
    const decision = decideComboIndexing(2);
    expect(decision.index).toBe(false);
    expect(decision.follow).toBe(true);
  });

  it("con exactamente MIN_CLINICS_FOR_INDEX (3) clínicas: index, follow", () => {
    const decision = decideComboIndexing(3);
    expect(decision.index).toBe(true);
    expect(decision.follow).toBe(true);
  });

  it("con más de MIN_CLINICS_FOR_INDEX clínicas: index, follow", () => {
    const decision = decideComboIndexing(50);
    expect(decision.index).toBe(true);
    expect(decision.follow).toBe(true);
  });

  it("cada decisión trae un motivo legible y distinto entre index y noindex", () => {
    const noindexed = decideComboIndexing(1);
    const indexed = decideComboIndexing(5);
    expect(noindexed.reason).not.toBe(indexed.reason);
  });
});

describe("comboShouldBe404", () => {
  it("true con 0 clínicas", () => {
    expect(comboShouldBe404(0)).toBe(true);
  });

  it("false con 1 o más clínicas, aunque no llegue al mínimo de indexación", () => {
    expect(comboShouldBe404(1)).toBe(false);
    expect(comboShouldBe404(2)).toBe(false);
    expect(comboShouldBe404(3)).toBe(false);
  });
});

describe("decideCityIndexing", () => {
  it("con 0 clínicas: noindex, follow", () => {
    const decision = decideCityIndexing(0);
    expect(decision.index).toBe(false);
    expect(decision.follow).toBe(true);
  });

  it("con 1 clínica ya indexa (el umbral de municipio es distinto al de combinación)", () => {
    const decision = decideCityIndexing(1);
    expect(decision.index).toBe(true);
    expect(decision.follow).toBe(true);
  });

  it("con muchas clínicas sigue indexando", () => {
    const decision = decideCityIndexing(200);
    expect(decision.index).toBe(true);
  });
});

describe("decideClinicIndexing", () => {
  it("PUBLISHED: index, follow", () => {
    const decision = decideClinicIndexing("PUBLISHED");
    expect(decision.index).toBe(true);
    expect(decision.follow).toBe(true);
  });

  it("DRAFT, PENDING_REVIEW y SUSPENDED: noindex, nofollow", () => {
    for (const status of ["DRAFT", "PENDING_REVIEW", "SUSPENDED"] as const) {
      const decision = decideClinicIndexing(status);
      expect(decision.index).toBe(false);
      expect(decision.follow).toBe(false);
    }
  });
});

describe("decideTreatmentIndexing", () => {
  it("siempre indexa", () => {
    const decision = decideTreatmentIndexing();
    expect(decision.index).toBe(true);
    expect(decision.follow).toBe(true);
  });
});

describe("decideStaticIndexing", () => {
  it("indexa los hubs y páginas de marca/confianza", () => {
    for (const path of ["/", "/tratamientos", "/ciudades", "/como-funciona", "/para-clinicas", "/legal/aviso-legal"]) {
      const decision = decideStaticIndexing(path);
      expect(decision.index).toBe(true);
      expect(decision.follow).toBe(true);
    }
  });

  it("no indexa ni sigue las rutas privadas", () => {
    for (const path of ["/alta-clinica", "/login", "/dashboard", "/dashboard/leads", "/admin", "/admin/clinicas", "/r"]) {
      const decision = decideStaticIndexing(path);
      expect(decision.index).toBe(false);
      expect(decision.follow).toBe(false);
    }
  });
});
