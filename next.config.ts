import type { NextConfig } from "next";

/** Escapa los caracteres especiales de regex de un host (sobre todo los puntos del dominio). */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Host canónico de producción, derivado de `NEXT_PUBLIC_SITE_URL` (o
 * `NEXT_PUBLIC_APP_URL` como respaldo — mismo orden que `src/lib/seo/config.ts`).
 * No se puede importar ese módulo aquí: `next.config.ts` se evalúa antes de
 * que el resolutor de alias de TypeScript (`@/*`) esté disponible, así que
 * la lógica se repite de forma mínima y autocontenida.
 *
 * Devuelve `null` cuando no hay host de producción configurado o cuando es
 * localhost: sin un host real conocido, no se puede forzar una redirección
 * sin arriesgarse a dejar el sitio inaccesible en un entorno donde la
 * variable aún no está definida.
 */
function canonicalHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    return url.host;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Next ya redirige /ruta/ -> /ruta (308) cuando trailingSlash es false: es
  // el mecanismo que evita contenido duplicado por la barra final, sin
  // necesidad de una regla de redirects() a mano.
  trailingSlash: false,

  images: {
    formats: ["image/avif", "image/webp"],
    // Las fotos son locales (public/img); no hay ningún host remoto que
    // permitir todavía. Añadir aquí el dominio el día que haya imágenes
    // subidas por las clínicas a un storage externo.
    remotePatterns: [],
  },

  async redirects() {
    const host = canonicalHost();
    if (!host) return [];

    return [
      {
        // Cualquier host que NO sea el canónico (www, un alias antiguo de
        // Vercel, un dominio de prueba apuntado por error…) se redirige de
        // forma permanente al host canónico, conservando la ruta.
        source: "/:path*",
        has: [{ type: "host", value: `(?!^${escapeRegExp(host)}$).*` }],
        destination: `https://${host}/:path*`,
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        // Las fotos de public/img son de contenido fijo del proyecto (banco
        // de imágenes empaquetado, no subidas por usuarios): un año de
        // caché inmutable es seguro porque un cambio de imagen implica un
        // nuevo despliegue con una URL de assets distinta.
        source: "/img/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
