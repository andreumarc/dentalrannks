import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { ClinicSwitcher } from "@/components/dashboard/clinic-switcher";
import { NoClinicsState } from "@/components/dashboard/no-clinics";
import { requireActiveClinic } from "@/server/dashboard";

/**
 * `/dashboard` está en `PRIVATE_PATH_PREFIXES` (ver `src/lib/seo/urls.ts`) y
 * bloqueado en `robots.ts`, pero ninguna página de este árbol fijaba su
 * propio `robots` (a diferencia de `/admin` y `/login`, que sí lo hacen en
 * cada página) — heredaba en silencio el `index: true, follow: true` por
 * defecto del layout raíz. Se fija aquí, en el layout, para que las nueve
 * páginas de `/dashboard/**` queden cubiertas de una vez sin tener que
 * repetirlo en cada una.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Los layouts de Next 15 no reciben `searchParams`, así que aquí solo se
 * resuelve la lista de clínicas accesibles. La clínica activa la determina
 * cada página en servidor a partir de `?clinic=`, validando el acceso.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, active } = await requireActiveClinic();

  if (!active) {
    return <NoClinicsState />;
  }

  return (
    <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="flex flex-col gap-6 bg-anthracite px-4 py-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Link href="/dashboard" className="px-1">
          <Logo inverted size={32} subtitle="Panel de clínica" />
        </Link>
        <ClinicSwitcher clinics={active.clinics} />
        <DashboardSidebar />
        <div className="mt-auto pt-6 text-[11.5px] leading-relaxed text-grey-soft">
          <p>
            El <span className="text-white">DentalRank Score</span> nunca depende del dinero
            invertido en patrocinio.
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <DashboardHeader user={user} clinics={active.clinics} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
