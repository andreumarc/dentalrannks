import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runSeed } from "@/server/seed";

/**
 * Herramienta de puesta en marcha y datos de demostración.
 *
 * Este endpoint NO forma parte del producto: existe únicamente para poder
 * poblar (o repoblar) el entorno con datos ficticios de demostración desde el
 * pipeline de despliegue, sin necesidad de acceso directo a la base de datos.
 *
 * Protección:
 *  - Si la variable de entorno `SEED_TOKEN` no está definida, el endpoint no
 *    existe: responde 404 en cualquier caso (no revela ni siquiera que la
 *    ruta está implementada).
 *  - Si está definida, solo se ejecuta cuando la cabecera `x-seed-token`
 *    coincide EXACTAMENTE con `SEED_TOKEN`, comparada en tiempo constante
 *    para no filtrar el token por temporización.
 *
 * Body opcional: `{ "reset": boolean }`.
 *  - `reset: true` borra los datos de demostración existentes y los vuelve a
 *    generar desde cero.
 *  - Sin `reset` (o `false`), el seed es idempotente: si ya se había
 *    ejecutado, no duplica nada y devuelve el recuento actual.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function timingSafeTokenMatch(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  // Igualar longitudes evita filtrar información por la excepción que lanza
  // `timingSafeEqual` cuando los buffers no miden lo mismo, sin dejar de
  // comparar en tiempo constante el contenido cuando sí coinciden.
  if (providedBuf.length !== expectedBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }
  return timingSafeEqual(providedBuf, expectedBuf);
}

export async function POST(request: NextRequest) {
  const seedToken = process.env.SEED_TOKEN;
  if (!seedToken) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const provided = request.headers.get("x-seed-token") ?? "";
  if (!provided || !timingSafeTokenMatch(provided, seedToken)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let reset = false;
  try {
    const body = await request.json();
    if (body && typeof body === "object" && "reset" in body) {
      reset = Boolean((body as { reset?: unknown }).reset);
    }
  } catch {
    // Cuerpo vacío o ausente: se interpreta como `reset: false`.
  }

  try {
    const summary = await runSeed({ reset });
    return NextResponse.json({ ok: true, reset, summary });
  } catch (error) {
    console.error("Error al ejecutar el seed de demostración:", error);
    return NextResponse.json({ ok: false, error: "Error al ejecutar el seed" }, { status: 500 });
  }
}
