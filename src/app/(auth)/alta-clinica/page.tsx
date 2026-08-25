import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ClinicSignupForm } from "@/components/auth/signup-form";
import { getSignupCities, getSignupTreatments } from "@/server/onboarding";
import { safeRead } from "@/lib/safe";

export const metadata: Metadata = {
  title: "Da de alta tu clínica",
  robots: { index: false, follow: false },
};

export default async function AltaClinicaPage() {
  const [cities, treatments] = await Promise.all([
    safeRead(getSignupCities, [], "alta:cities"),
    safeRead(getSignupTreatments, [], "alta:treatments"),
  ]);

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-line bg-white">
        <div className="wrap flex items-center justify-between py-5">
          <Link href="/">
            <Logo size={30} />
          </Link>
          <p className="text-[13.5px] text-grey">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-cyan-deep hover:text-cyan-brand">
              Entra aquí
            </Link>
          </p>
        </div>
      </header>

      <main className="wrap section max-w-3xl">
        <p className="kicker">Alta de clínica</p>
        <h1 className="display-h2 mt-2 text-ink">Da de alta tu clínica en DentalRank</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-grey">
          Un único formulario para crear tu cuenta, tu clínica y tu panel de gestión. La ficha pasa por una revisión
          del equipo de DentalRank antes de publicarse en el marketplace.
        </p>
        <p className="mt-3 max-w-2xl text-[15px] text-grey">
          El alta y la ficha no tienen coste.{" "}
          <Link href="/para-clinicas" className="font-medium text-cyan-deep hover:text-cyan-brand">
            Cómo funciona el proceso completo, gratis y de pago
          </Link>
          .
        </p>

        <div className="mt-10 rounded-brand border border-line bg-white p-6 sm:p-8">
          <ClinicSignupForm cities={cities} treatments={treatments} />
        </div>
      </main>
    </div>
  );
}
