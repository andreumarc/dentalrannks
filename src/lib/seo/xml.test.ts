import { describe, expect, it } from "vitest";
import { escapeXml, buildUrlset, buildSitemapIndex, SITEMAP_PAGE_SIZE } from "./xml";

describe("escapeXml", () => {
  it("escapa los cinco caracteres especiales de XML", () => {
    expect(escapeXml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &apos;");
  });

  it("no toca el texto que no tiene caracteres especiales", () => {
    expect(escapeXml("implantes-barcelona")).toBe("implantes-barcelona");
  });

  it("escapa el '&' de un nombre de clínica real tipo 'Smile & Co'", () => {
    expect(escapeXml("clinica-smile-&-co")).toBe("clinica-smile-&amp;-co");
  });
});

describe("buildUrlset", () => {
  it("genera un urlset válido con las URLs dadas", () => {
    const xml = buildUrlset([{ loc: "https://dentalrank.example/" }]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<loc>https://dentalrank.example/</loc>");
    expect(xml).toContain("</urlset>");
  });

  it("incluye lastmod en formato ISO 8601 cuando se proporciona", () => {
    const date = new Date("2026-03-15T10:00:00.000Z");
    const xml = buildUrlset([{ loc: "https://dentalrank.example/clinica/demo", lastmod: date }]);
    expect(xml).toContain("<lastmod>2026-03-15T10:00:00.000Z</lastmod>");
  });

  it("omite lastmod cuando no se proporciona (nunca inventa una fecha)", () => {
    const xml = buildUrlset([{ loc: "https://dentalrank.example/tratamientos" }]);
    expect(xml).not.toContain("<lastmod>");
  });

  it("nunca incluye changefreq ni priority", () => {
    const xml = buildUrlset([{ loc: "https://dentalrank.example/", lastmod: new Date() }]);
    expect(xml).not.toContain("changefreq");
    expect(xml).not.toContain("priority");
  });

  it("escapa las URLs con caracteres especiales", () => {
    const xml = buildUrlset([{ loc: "https://dentalrank.example/clinica/smile-&-co" }]);
    expect(xml).toContain("smile-&amp;-co");
    expect(xml).not.toContain("smile-&-co<");
  });

  it("un urlset vacío sigue siendo XML válido (tolerancia a fallo de base de datos)", () => {
    const xml = buildUrlset([]);
    expect(xml).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    );
  });
});

describe("buildSitemapIndex", () => {
  it("genera un sitemapindex válido", () => {
    const xml = buildSitemapIndex([{ loc: "https://dentalrank.example/sitemaps/paginas.xml" }]);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<sitemap><loc>https://dentalrank.example/sitemaps/paginas.xml</loc></sitemap>");
    expect(xml).toContain("</sitemapindex>");
  });

  it("incluye lastmod cuando se proporciona", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const xml = buildSitemapIndex([{ loc: "https://dentalrank.example/sitemaps/clinicas/1.xml", lastmod: date }]);
    expect(xml).toContain("<lastmod>2026-01-01T00:00:00.000Z</lastmod>");
  });
});

describe("SITEMAP_PAGE_SIZE", () => {
  it("es 5000", () => {
    expect(SITEMAP_PAGE_SIZE).toBe(5000);
  });
});
