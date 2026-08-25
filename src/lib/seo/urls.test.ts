import { describe, expect, it } from "vitest";
import { paths, isPrivatePath, isReservedSlug, PRIVATE_PATH_PREFIXES } from "./urls";

describe("paths", () => {
  it("construye las rutas estáticas y de hub", () => {
    expect(paths.home()).toBe("/");
    expect(paths.treatmentHub()).toBe("/tratamientos");
    expect(paths.cityHub()).toBe("/ciudades");
    expect(paths.howItWorks()).toBe("/como-funciona");
    expect(paths.forClinics()).toBe("/para-clinicas");
  });

  it("construye las rutas legales", () => {
    expect(paths.legal("aviso-legal")).toBe("/legal/aviso-legal");
    expect(paths.legal("cookies")).toBe("/legal/cookies");
    expect(paths.legal("privacidad")).toBe("/legal/privacidad");
  });

  it("construye la página de tratamiento", () => {
    expect(paths.treatment("implantes")).toBe("/tratamientos/implantes");
  });

  it("construye la página de municipio", () => {
    expect(paths.city("barcelona")).toBe("/dentistas/barcelona");
  });

  it("construye la página dinero (combinación tratamiento×municipio)", () => {
    expect(paths.combo("implantes", "barcelona")).toBe("/implantes/barcelona");
  });

  it("construye la ficha de clínica", () => {
    expect(paths.clinic("clinica-dental-demo")).toBe("/clinica/clinica-dental-demo");
  });
});

describe("isPrivatePath", () => {
  it("reconoce cada prefijo privado exacto", () => {
    for (const prefix of PRIVATE_PATH_PREFIXES) {
      expect(isPrivatePath(prefix)).toBe(true);
    }
  });

  it("reconoce subrutas de un prefijo privado", () => {
    expect(isPrivatePath("/dashboard/leads")).toBe(true);
    expect(isPrivatePath("/admin/clinicas/123")).toBe(true);
    expect(isPrivatePath("/r/click123")).toBe(true);
  });

  it("no marca como privadas rutas públicas legítimas", () => {
    expect(isPrivatePath("/")).toBe(false);
    expect(isPrivatePath("/implantes/barcelona")).toBe(false);
    expect(isPrivatePath("/dentistas/barcelona")).toBe(false);
    expect(isPrivatePath("/clinica/clinica-demo")).toBe(false);
  });

  it("no confunde un prefijo con otra ruta que solo comparte el inicio del nombre", () => {
    // "/administracion" no es "/admin": no debe tratarse como ruta privada.
    expect(isPrivatePath("/administracion")).toBe(false);
    expect(isPrivatePath("/logingratis")).toBe(false);
  });
});

describe("slugs reservados", () => {
  it("detecta los segmentos que ya usa la aplicación", () => {
    expect(isReservedSlug("dentistas")).toBe(true);
    expect(isReservedSlug("Legal")).toBe(true);
    expect(isReservedSlug(" admin ")).toBe(true);
  });

  it("deja pasar un slug de tratamiento normal", () => {
    expect(isReservedSlug("implantes")).toBe(false);
    expect(isReservedSlug("ortodoncia-invisible")).toBe(false);
  });

  it("cubre todos los segmentos estáticos de primer nivel de la aplicación", () => {
    // Si se añade una ruta pública nueva de primer nivel, hay que añadirla aquí:
    // de lo contrario un tratamiento con ese slug quedaría inalcanzable.
    for (const segmento of ["tratamientos", "ciudades", "clinica", "dentistas"]) {
      expect(isReservedSlug(segmento)).toBe(true);
    }
  });
});
