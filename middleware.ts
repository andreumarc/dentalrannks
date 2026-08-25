import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware de seguridad.
 *
 * - Protege `/dashboard` y `/admin`: sin sesión, redirige a `/login?callbackUrl=...`;
 *   `/admin` exige además `role === "SUPER_ADMIN"`.
 * - Añade cabeceras de seguridad a todas las respuestas que pasan por aquí.
 *
 * Deliberadamente NO importa `@/lib/auth` (que arrastra bcryptjs y PrismaClient,
 * no compatibles con el runtime de middleware). En su lugar decodifica el JWT
 * de sesión directamente con `next-auth/jwt`, que es ligero y no toca la base
 * de datos — igual que hace `auth()` bajo el capó para la estrategia "jwt".
 */

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Evita redirecciones abiertas: solo se acepta una ruta interna. */
function safeCallbackPath(pathname: string, search: string): string {
  const full = `${pathname}${search}`;
  if (!full.startsWith("/") || full.startsWith("//")) return "/dashboard";
  return full;
}

// En desarrollo, el HMR de Next (Fast Refresh, tanto con webpack como con
// Turbopack) evalúa código a través de `eval()`, lo que exige 'unsafe-eval'
// en script-src; en producción no se sirve ningún bundle que lo necesite, así
// que ahí se mantiene fuera para no debilitar la CSP innecesariamente.
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  `script-src 'self' https://js.stripe.com https://maps.googleapis.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://maps.gstatic.com https://*.googleapis.com https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://maps.googleapis.com https://*.stripe.com",
  "frame-src https://*.stripe.com",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()",
  );
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isProtectedPath(pathname)) {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req, secret });

    if (!token?.uid) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", safeCallbackPath(pathname, search));
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (pathname.startsWith("/admin") && token.role !== "SUPER_ADMIN") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", req.url)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
