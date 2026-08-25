import type { Metadata, Viewport } from "next";
import { Exo_2, Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE, GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION } from "@/lib/seo/config";

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-exo2",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // `SITE_URL` (no `appUrl()` directamente): mismo host normalizado y
  // forzado a https en producción que usan `absoluteUrl`/`buildMetadata`,
  // para que la base de resolución de rutas relativas nunca diverja del
  // canonical que lleva cada página.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} · Encuentra clínica dental, compara y solicita valoración`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  alternates: {
    // Valor por defecto para cuando una página no fija su propio
    // `alternates` — en la práctica todas las que este agente y el otro
    // poseen ya llaman a `buildMetadata`, que lo sobrescribe con su propia
    // ruta absoluta.
    canonical: "/",
    languages: { "es-ES": "/", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    locale: SITE.ogLocale,
    siteName: SITE.name,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  // Solo se declara la verificación de cada buscador cuando existe de
  // verdad la variable de entorno correspondiente: una etiqueta `meta` de
  // verificación con un valor de ejemplo o vacío no sirve de nada y puede
  // confundir a quien audite el `<head>`.
  ...(GOOGLE_SITE_VERIFICATION || BING_SITE_VERIFICATION
    ? {
        verification: {
          ...(GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : {}),
          ...(BING_SITE_VERIFICATION ? { other: { "msvalidate.01": BING_SITE_VERIFICATION } } : {}),
        },
      }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#393F42",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-ES" className={`${exo2.variable} ${outfit.variable} ${plexMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
