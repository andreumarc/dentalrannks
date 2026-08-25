import { describe, expect, it, afterEach, vi } from "vitest";

async function loadJsonld() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dentalrank.example");
  return import("./jsonld");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("organizationJsonLd", () => {
  it("expone identidad estable y logo absoluto, sin inventar sameAs", async () => {
    const { organizationJsonLd } = await loadJsonld();
    const org = organizationJsonLd();

    expect(org).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://dentalrank.example/#organization",
      name: "DentalRank",
      url: "https://dentalrank.example",
      logo: "https://dentalrank.example/icon.svg",
    });
    expect(org.sameAs).toBeUndefined();
  });
});

describe("webSiteJsonLd", () => {
  it("devuelve undefined sin una ruta de búsqueda real (caso actual: sin argumento)", async () => {
    const { webSiteJsonLd } = await loadJsonld();
    expect(webSiteJsonLd()).toBeUndefined();
    expect(webSiteJsonLd({})).toBeUndefined();
  });

  it("incluye potentialAction: SearchAction cuando se pasa una plantilla de búsqueda", async () => {
    const { webSiteJsonLd } = await loadJsonld();
    const site = webSiteJsonLd({
      searchUrlTemplate: "https://dentalrank.example/buscar?q={search_term_string}",
    });

    expect(site).toMatchObject({
      "@type": "WebSite",
      url: "https://dentalrank.example",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://dentalrank.example/buscar?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    });
  });
});

describe("breadcrumbJsonLd", () => {
  it("construye una posición por cada elemento y solo incluye `item` si hay href", async () => {
    const { breadcrumbJsonLd } = await loadJsonld();
    const jsonLd = breadcrumbJsonLd(
      [
        { label: "Inicio", href: "/" },
        { label: "Tratamientos", href: "/tratamientos" },
        { label: "Implantes" },
      ],
      "https://dentalrank.example",
    );

    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://dentalrank.example/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Tratamientos",
          item: "https://dentalrank.example/tratamientos",
        },
        { "@type": "ListItem", position: 3, name: "Implantes" },
      ],
    });
  });
});

describe("itemListJsonLd", () => {
  it("devuelve undefined con una lista vacía", async () => {
    const { itemListJsonLd } = await loadJsonld();
    expect(itemListJsonLd([])).toBeUndefined();
  });

  it("numera las posiciones en el mismo orden recibido", async () => {
    const { itemListJsonLd } = await loadJsonld();
    const jsonLd = itemListJsonLd([
      { url: "https://dentalrank.example/dentistas/barcelona", name: "Barcelona" },
      { url: "https://dentalrank.example/dentistas/igualada", name: "Igualada" },
    ]);

    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          url: "https://dentalrank.example/dentistas/barcelona",
          name: "Barcelona",
        },
        {
          "@type": "ListItem",
          position: 2,
          url: "https://dentalrank.example/dentistas/igualada",
          name: "Igualada",
        },
      ],
    });
  });
});

describe("medicalProcedureJsonLd", () => {
  it("devuelve undefined sin slug o sin nombre", async () => {
    const { medicalProcedureJsonLd } = await loadJsonld();
    expect(medicalProcedureJsonLd({ slug: "", name: "Implantes" })).toBeUndefined();
    expect(medicalProcedureJsonLd({ slug: "implantes", name: "" })).toBeUndefined();
  });

  it("omite `description` cuando no hay ninguna", async () => {
    const { medicalProcedureJsonLd } = await loadJsonld();
    const jsonLd = medicalProcedureJsonLd({ slug: "implantes", name: "Implantes dentales" });

    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "MedicalProcedure",
      "@id": "https://dentalrank.example/tratamientos/implantes",
      name: "Implantes dentales",
      url: "https://dentalrank.example/tratamientos/implantes",
    });
  });

  it("incluye `description` cuando existe", async () => {
    const { medicalProcedureJsonLd } = await loadJsonld();
    const jsonLd = medicalProcedureJsonLd({
      slug: "implantes",
      name: "Implantes dentales",
      description: "Sustitución de una pieza perdida por una raíz artificial.",
    });

    expect(jsonLd?.description).toBe("Sustitución de una pieza perdida por una raíz artificial.");
  });
});

describe("dentistJsonLd", () => {
  function baseInput() {
    return {
      slug: "clinica-demo",
      name: "Clínica Demo",
      phone: "+34600000000",
      address: "Carrer Major, 1",
      postalCode: "08700",
      cityName: "Igualada",
      regionName: "Cataluña",
      lat: 41.58,
      lng: 1.61,
    };
  }

  it("devuelve undefined si falta un dato obligatorio de identidad o localización", async () => {
    const { dentistJsonLd } = await loadJsonld();
    expect(dentistJsonLd({ ...baseInput(), address: "" })).toBeUndefined();
    expect(dentistJsonLd({ ...baseInput(), phone: "" })).toBeUndefined();
    expect(dentistJsonLd({ ...baseInput(), postalCode: "" })).toBeUndefined();
  });

  it("construye @id, url, address y geo con los datos mínimos", async () => {
    const { dentistJsonLd } = await loadJsonld();
    const jsonLd = dentistJsonLd(baseInput());

    expect(jsonLd).toMatchObject({
      "@type": "Dentist",
      "@id": "https://dentalrank.example/clinica/clinica-demo",
      url: "https://dentalrank.example/clinica/clinica-demo",
      name: "Clínica Demo",
      telephone: "+34600000000",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Carrer Major, 1",
        postalCode: "08700",
        addressLocality: "Igualada",
        addressRegion: "Cataluña",
        addressCountry: "ES",
      },
      geo: { "@type": "GeoCoordinates", latitude: 41.58, longitude: 1.61 },
    });
  });

  it("nunca emite aggregateRating sin reseñas, aunque haya una nota", async () => {
    const { dentistJsonLd } = await loadJsonld();
    const withoutCount = dentistJsonLd({ ...baseInput(), externalRating: 4.8, externalReviewCount: 0 });
    const withoutRating = dentistJsonLd({ ...baseInput(), externalRating: null, externalReviewCount: 12 });

    expect(withoutCount?.aggregateRating).toBeUndefined();
    expect(withoutRating?.aggregateRating).toBeUndefined();
  });

  it("emite aggregateRating con el recuento real cuando hay al menos una reseña", async () => {
    const { dentistJsonLd } = await loadJsonld();
    const jsonLd = dentistJsonLd({ ...baseInput(), externalRating: 4.6, externalReviewCount: 37 });

    expect(jsonLd?.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.6,
      reviewCount: 37,
    });
  });

  it("omite openingHoursSpecification si no se pasa o viene vacío", async () => {
    const { dentistJsonLd } = await loadJsonld();
    expect(dentistJsonLd(baseInput())?.openingHoursSpecification).toBeUndefined();
    expect(dentistJsonLd({ ...baseInput(), openingHoursSpecification: [] })?.openingHoursSpecification).toBeUndefined();
  });

  it("incluye openingHoursSpecification tal cual cuando se pasa", async () => {
    const { dentistJsonLd } = await loadJsonld();
    const spec = [{ "@type": "OpeningHoursSpecification" as const, dayOfWeek: "Monday", opens: "09:00", closes: "14:00" }];
    const jsonLd = dentistJsonLd({ ...baseInput(), openingHoursSpecification: spec });

    expect(jsonLd?.openingHoursSpecification).toEqual(spec);
  });

  it("omite sameAs sin website y lo incluye con website", async () => {
    const { dentistJsonLd } = await loadJsonld();
    expect(dentistJsonLd(baseInput())?.sameAs).toBeUndefined();
    expect(dentistJsonLd({ ...baseInput(), website: "https://clinica-demo.example" })?.sameAs).toEqual([
      "https://clinica-demo.example",
    ]);
  });

  it("omite availableService sin tratamientos y lo construye con nombres reales", async () => {
    const { dentistJsonLd } = await loadJsonld();
    expect(dentistJsonLd(baseInput())?.availableService).toBeUndefined();

    const jsonLd = dentistJsonLd({ ...baseInput(), treatmentNames: ["Implantes", "Invisalign"] });
    expect(jsonLd?.availableService).toEqual([
      { "@type": "MedicalProcedure", name: "Implantes" },
      { "@type": "MedicalProcedure", name: "Invisalign" },
    ]);
  });
});
