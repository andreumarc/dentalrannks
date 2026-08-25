import { describe, expect, it, afterEach, vi } from "vitest";
import { clampTitle, clampDescription } from "./metadata";

describe("clampTitle", () => {
  it("no modifica un título que ya cabe con el sufijo de marca", () => {
    expect(clampTitle("Implantes en Barcelona")).toBe("Implantes en Barcelona");
  });

  it("recorta un título largo sin cortar una palabra por la mitad", () => {
    const long =
      "Implantes dentales de titanio con garantía de por vida y financiación sin intereses en Barcelona centro";
    const result = clampTitle(long);
    expect(result.endsWith("…")).toBe(true);
    // Ninguna palabra del resultado (salvo la elipsis) debe ser un fragmento
    // que no exista tal cual en el texto original.
    const words = result.replace("…", "").trim().split(" ");
    for (const word of words) {
      expect(long).toContain(word);
    }
  });

  it("reserva espacio para el sufijo de marca por defecto", () => {
    // 60 - " | DentalRank".length (13) = 47 caracteres de presupuesto.
    const exactly47 = "x".repeat(47);
    const exactly48 = "x".repeat(48);
    expect(clampTitle(exactly47)).toBe(exactly47);
    expect(clampTitle(exactly48).length).toBeLessThan(exactly48.length);
  });

  it("con includeSuffix: false usa todo el presupuesto, sin reservar el sufijo", () => {
    const exactly60 = "x".repeat(60);
    expect(clampTitle(exactly60, { includeSuffix: false })).toBe(exactly60);
  });

  it("respeta un `max` personalizado", () => {
    const text = "Palabra ".repeat(10).trim();
    const result = clampTitle(text, { max: 20, includeSuffix: false });
    expect(result.length).toBeLessThanOrEqual(20);
  });
});

describe("clampDescription", () => {
  it("no modifica una descripción que ya cabe", () => {
    const short = "Compara clínicas dentales en Barcelona.";
    expect(clampDescription(short)).toBe(short);
  });

  it("recorta al límite de ~155 caracteres sin cortar palabras", () => {
    const long =
      "Compara clínicas de implantes dentales en Barcelona por valoración, DentalRank Score y precio orientativo. Solicita una valoración gratuita en menos de dos minutos y recibe respuesta de varias clínicas verificadas de la ciudad.";
    const result = clampDescription(long);
    expect(result.length).toBeLessThanOrEqual(155);
    expect(result.endsWith("…")).toBe(true);
    const words = result.replace("…", "").trim().split(" ");
    for (const word of words) {
      expect(long).toContain(word);
    }
  });

  it("respeta un `max` personalizado", () => {
    const result = clampDescription("Esta es una descripción de prueba bastante larga para el recorte", 20);
    expect(result.length).toBeLessThanOrEqual(20);
  });
});

describe("buildMetadata", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadBuildMetadata() {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dentalrank.example");
    return import("./metadata");
  }

  it("genera canonical absoluto y hreflang es-ES + x-default apuntando a la misma URL", async () => {
    const { buildMetadata } = await loadBuildMetadata();
    const metadata = buildMetadata({
      title: "Implantes en Barcelona",
      description: "Compara clínicas de implantes en Barcelona.",
      path: "/implantes/barcelona",
    });

    expect(metadata.alternates?.canonical).toBe("https://dentalrank.example/implantes/barcelona");
    expect(metadata.alternates?.languages).toEqual({
      "es-ES": "https://dentalrank.example/implantes/barcelona",
      "x-default": "https://dentalrank.example/implantes/barcelona",
    });
  });

  it("por defecto es indexable y con follow", async () => {
    const { buildMetadata } = await loadBuildMetadata();
    const metadata = buildMetadata({
      title: "Implantes en Barcelona",
      description: "Compara clínicas de implantes en Barcelona.",
      path: "/implantes/barcelona",
    });

    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    });
  });

  it("respeta index: false y follow: true (política noindex,follow)", async () => {
    const { buildMetadata } = await loadBuildMetadata();
    const metadata = buildMetadata({
      title: "Implantes en Vilanova",
      description: "Página con pocas clínicas todavía.",
      path: "/implantes/vilanova",
      index: false,
      follow: true,
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    });
  });

  it("openGraph incluye url absoluta, siteName, locale es_ES e imágenes con alt", async () => {
    const { buildMetadata } = await loadBuildMetadata();
    const metadata = buildMetadata({
      title: "Implantes en Barcelona",
      description: "Compara clínicas de implantes en Barcelona.",
      path: "/implantes/barcelona",
      images: [{ url: "https://dentalrank.example/og/implantes-barcelona.png", width: 1200, height: 630, alt: "Implantes en Barcelona" }],
    });

    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: "https://dentalrank.example/implantes/barcelona",
      siteName: "DentalRank",
      locale: "es_ES",
    });
    expect((metadata.openGraph as { images?: unknown[] })?.images).toEqual([
      { url: "https://dentalrank.example/og/implantes-barcelona.png", width: 1200, height: 630, alt: "Implantes en Barcelona" },
    ]);
  });

  it("twitter usa summary_large_image", async () => {
    const { buildMetadata } = await loadBuildMetadata();
    const metadata = buildMetadata({
      title: "Implantes en Barcelona",
      description: "Compara clínicas de implantes en Barcelona.",
      path: "/implantes/barcelona",
    });

    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("type: article añade publishedTime y modifiedTime a openGraph", async () => {
    const { buildMetadata } = await loadBuildMetadata();
    const metadata = buildMetadata({
      title: "Cómo elegir una clínica de implantes",
      description: "Guía para elegir una clínica de implantes dentales.",
      path: "/blog/como-elegir-implantes",
      type: "article",
      publishedTime: "2026-01-01T00:00:00.000Z",
      modifiedTime: "2026-02-01T00:00:00.000Z",
    });

    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-01-01T00:00:00.000Z",
      modifiedTime: "2026-02-01T00:00:00.000Z",
    });
  });
});
