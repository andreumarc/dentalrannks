import { ImageResponse } from "next/og";

/**
 * Generador reutilizable de imágenes OpenGraph (1200×630, el tamaño estándar
 * que respetan Facebook, X/Twitter, LinkedIn y WhatsApp al mostrar una
 * vista previa de enlace).
 *
 * Deliberadamente NO carga ninguna fuente externa: usa la fuente por
 * defecto de Satori (el motor que hay detrás de `next/og`) para que la
 * generación no dependa de la red ni pueda hacer fallar el build si un
 * `fetch` de fuente falla o tarda. Tampoco carga imágenes remotas.
 *
 * Este archivo solo genera la imagen para la home
 * (`src/app/opengraph-image.tsx`). Las rutas dinámicas (tratamiento,
 * municipio, combinación, clínica) generan su propia imagen con
 * `renderOgImage({ title, subtitle })` desde su propio
 * `opengraph-image.tsx` — eso lo hace otro agente; aquí solo se deja
 * preparado el generador.
 */

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const OG_IMAGE_CONTENT_TYPE = "image/png" as const;

// Identidad visual de la marca (misma paleta que el resto del sitio):
// antracita de fondo con degradado cian.
const ANTHRACITE = "#393F42";
const CYAN = "#01ADD0";

export type OgImageParams = {
  /** Texto principal, en caja alta (se transforma por CSS, no hace falta pasarlo en mayúsculas). */
  title: string;
  /** Línea secundaria opcional, p. ej. el claim de marca o el contexto de la página. */
  subtitle?: string;
};

/**
 * Devuelve una `ImageResponse` (PNG 1200×630) lista para exportarse como
 * `default` de un archivo `opengraph-image.tsx`.
 *
 * Nota: si Satori no pudiera renderizar el JSX (por ejemplo, por un cambio
 * futuro que introduzca CSS no soportado), esta función lanzaría una
 * excepción de forma síncrona; quien la use debe envolver la llamada en un
 * `try/catch` con un JSX de respaldo aún más simple, para que un fallo en la
 * imagen OG nunca tumbe el build (ver `src/app/opengraph-image.tsx`).
 */
export function renderOgImage({ title, subtitle }: OgImageParams): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          backgroundColor: ANTHRACITE,
          backgroundImage: `linear-gradient(135deg, ${ANTHRACITE} 40%, ${CYAN} 160%)`,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "20px",
              height: "20px",
              backgroundColor: CYAN,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "4px",
              color: "#FFFFFF",
              textTransform: "uppercase",
            }}
          >
            DentalRank
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "64px",
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#FFFFFF",
            maxWidth: "980px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              marginTop: "28px",
              fontSize: "30px",
              color: "#E5F8FC",
              maxWidth: "900px",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    ),
    { ...OG_IMAGE_SIZE },
  );
}
