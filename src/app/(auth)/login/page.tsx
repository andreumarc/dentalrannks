import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Acceso de clínicas",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hero-gradient grid-lines relative hidden flex-col justify-between overflow-hidden px-10 py-12 lg:flex xl:px-16">
        <Link href="/">
          <Logo inverted size={34} subtitle="Panel de clínica" />
        </Link>

        <div className="max-w-md">
          <p className="kicker text-cyan-soft">Acceso privado</p>
          <h1 className="display-h2 mt-3 text-white">
            Gestiona leads, posiciones y saldo <span className="accent-cyan">desde un único panel</span>
          </h1>
          <ul className="mt-8 flex flex-col gap-4">
            <li className="flex items-start gap-3 text-[14.5px] text-grey-soft">
              <Users className="mt-0.5 size-5 shrink-0 text-cyan-brand" />
              Solicitudes de pacientes en tiempo real, con estado y trazabilidad.
            </li>
            <li className="flex items-start gap-3 text-[14.5px] text-grey-soft">
              <TrendingUp className="mt-0.5 size-5 shrink-0 text-cyan-brand" />
              Posiciones patrocinadas calculadas siempre en servidor.
            </li>
            <li className="flex items-start gap-3 text-[14.5px] text-grey-soft">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-cyan-brand" />
              El DentalRank Score nunca depende de lo que inviertas en patrocinio.
            </li>
          </ul>
        </div>

        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-grey-soft">
          © {new Date().getFullYear()} DentalRank · Impulsodent Consulting
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo size={32} />
            </Link>
          </div>

          <p className="kicker">Bienvenido de nuevo</p>
          <h2 className="display-h3 mt-2 text-ink">Accede a tu panel</h2>
          <p className="mt-2 text-[14.5px] text-grey">Introduce tus credenciales para gestionar tu clínica.</p>

          <div className="mt-8">
            <LoginForm callbackUrl={sp.callbackUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
