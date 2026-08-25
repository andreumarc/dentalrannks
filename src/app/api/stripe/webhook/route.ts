import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { processStripeEvent } from "@/server/stripe";

// El webhook necesita el runtime de Node (verificación de firma con el SDK
// de Stripe y acceso a Prisma) y el cuerpo crudo de la petición, nunca JSON
// ya parseado por Next.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    // Los pagos no están configurados en este entorno: no hay nada que procesar.
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta la firma del webhook" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
  }

  try {
    await processStripeEvent(event);
  } catch (error) {
    console.error("[stripe webhook] error procesando evento", event.type, event.id, error);
    // 500 para que Stripe reintente; StripeEvent solo se inserta si el
    // procesamiento no lanzó, así que un reintento no duplica nada.
    return NextResponse.json({ error: "Error procesando el evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
