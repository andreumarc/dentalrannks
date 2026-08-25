import { NextResponse } from "next/server";
import { currentUser, assertClinicAccess, AuthorizationError } from "@/lib/authz";
import { topUpSchema } from "@/lib/validation";
import { stripeEnabled } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createTopUpCheckout } from "@/server/stripe";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const limit = await rateLimit("stripe-checkout", user.id, 12, 60 * 10);
  if (!limit.ok) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Inténtalo en unos minutos." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = topUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });
  }

  try {
    await assertClinicAccess(user, parsed.data.clinicId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    throw error;
  }

  if (!stripeEnabled()) {
    return NextResponse.json({ disabled: true }, { status: 200 });
  }

  try {
    const result = await createTopUpCheckout({
      user,
      clinicId: parsed.data.clinicId,
      amountEuros: parsed.data.amountEuros,
    });
    if ("disabled" in result) {
      return NextResponse.json({ disabled: true }, { status: 200 });
    }
    return NextResponse.json({ url: result.url }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 502 });
  }
}
