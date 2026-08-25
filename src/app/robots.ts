import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo/config";
import { PRIVATE_PATH_PREFIXES } from "@/lib/seo/urls";

/**
 * Rastreadores usados por asistentes de IA para responder preguntas (no para
 * servir anuncios ni entrenar modelos indiscriminadamente). Se permiten por
 * DEFECTO: al negocio le interesa que DentalRank aparezca citado en
 * respuestas de ChatGPT, Perplexity, Claude, etc., igual que le interesa
 * aparecer en Google. Si en el futuro se prefiere bloquear alguno en
 * concreto, basta con moverlo de `AI_CRAWLERS_ALLOWED` a
 * `AI_CRAWLERS_BLOCKED` — ambas listas están aquí, una de ellas vacía, para
 * que el cambio sea de una línea.
 */
const AI_CRAWLERS_ALLOWED = [
  "GPTBot", // OpenAI (ChatGPT, entrenamiento)
  "ChatGPT-User", // OpenAI (navegación en vivo dentro de ChatGPT)
  "OAI-SearchBot", // OpenAI (ChatGPT search)
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot", // Anthropic (entrenamiento)
  "Claude-User", // Anthropic (navegación en vivo dentro de Claude)
  "Google-Extended", // Gemini / funciones de IA de Google, aparte del rastreador de búsqueda normal
];

const AI_CRAWLERS_BLOCKED: string[] = [
  // Ejemplo para bloquear uno concreto sin tocar el resto:
  // "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = [...PRIVATE_PATH_PREFIXES, "/api", "/*?*utm_"];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...AI_CRAWLERS_ALLOWED.map((userAgent) => ({ userAgent, allow: "/", disallow })),
      ...AI_CRAWLERS_BLOCKED.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
