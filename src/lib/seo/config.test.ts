import { describe, expect, it, afterEach, vi } from "vitest";

/**
 * `SITE_URL` se calcula una vez, al cargar el módulo (igual que `appUrl()`
 * en `src/lib/env.ts` y `SALT` en `src/lib/hash.ts`), así que cada caso
 * necesita su propia importación fresca tras fijar las variables de entorno.
 */
async function loadConfig() {
  vi.resetModules();
  return import("./config");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("SITE_URL", () => {
  it("usa NEXT_PUBLIC_SITE_URL cuando está definida, incluso si NEXT_PUBLIC_APP_URL también lo está", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dentalrank.example");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://otro-host.example");
    const { SITE_URL } = await loadConfig();
    expect(SITE_URL).toBe("https://dentalrank.example");
  });

  it("usa NEXT_PUBLIC_APP_URL como respaldo si no hay NEXT_PUBLIC_SITE_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://respaldo.example");
    const { SITE_URL } = await loadConfig();
    expect(SITE_URL).toBe("https://respaldo.example");
  });

  it("elimina la barra final, incluso repetida", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dentalrank.example///");
    const { SITE_URL } = await loadConfig();
    expect(SITE_URL).toBe("https://dentalrank.example");
  });

  it("fuerza https en producción cuando la variable trae http://", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://dentalrank.example");
    vi.stubEnv("NODE_ENV", "production");
    const { SITE_URL } = await loadConfig();
    expect(SITE_URL).toBe("https://dentalrank.example");
  });

  it("no toca http:// fuera de producción (localhost en desarrollo)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "development");
    const { SITE_URL } = await loadConfig();
    expect(SITE_URL).toBe("http://localhost:3000");
  });
});

describe("absoluteUrl", () => {
  it("concatena host y ruta, admitiendo la ruta con o sin barra inicial", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dentalrank.example");
    const { absoluteUrl } = await loadConfig();
    expect(absoluteUrl("/tratamientos/implantes")).toBe(
      "https://dentalrank.example/tratamientos/implantes",
    );
    expect(absoluteUrl("tratamientos/implantes")).toBe(
      "https://dentalrank.example/tratamientos/implantes",
    );
  });

  it("la home queda en la raíz, sin barra doble", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dentalrank.example");
    const { absoluteUrl } = await loadConfig();
    expect(absoluteUrl("/")).toBe("https://dentalrank.example/");
  });
});

describe("identificadores de verificación de buscadores", () => {
  it("no se emiten si la variable de entorno no está definida", async () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "");
    vi.stubEnv("BING_SITE_VERIFICATION", "");
    const mod = await loadConfig();
    expect(mod.GOOGLE_SITE_VERIFICATION).toBeUndefined();
    expect(mod.BING_SITE_VERIFICATION).toBeUndefined();
  });

  it("se emiten cuando la variable de entorno existe", async () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "google-abc123");
    vi.stubEnv("BING_SITE_VERIFICATION", "bing-xyz789");
    const mod = await loadConfig();
    expect(mod.GOOGLE_SITE_VERIFICATION).toBe("google-abc123");
    expect(mod.BING_SITE_VERIFICATION).toBe("bing-xyz789");
  });
});

describe("SITE", () => {
  it("no inventa un identificador de Twitter/X sin confirmar", async () => {
    const { SITE } = await loadConfig();
    expect(SITE.twitterHandle).toBeUndefined();
  });

  it("expone el locale de España", async () => {
    const { SITE } = await loadConfig();
    expect(SITE.locale).toBe("es-ES");
    expect(SITE.ogLocale).toBe("es_ES");
  });
});
