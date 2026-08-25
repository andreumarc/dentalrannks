import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { CookieNotice } from "@/components/public/cookie-notice";
import { getTreatments, getCitiesWithClinics } from "@/server/catalog";
import { safeRead } from "@/lib/safe";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [treatments, cities] = await Promise.all([
    safeRead(getTreatments, [], "layout:treatments"),
    safeRead(getCitiesWithClinics, [], "layout:cities"),
  ]);

  const navTreatments = treatments.map((t) => ({ slug: t.slug, name: t.name }));
  const navCities = cities.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-brand focus:bg-cyan-brand focus:px-4 focus:py-2.5 focus:text-white"
      >
        Saltar al contenido
      </a>
      <SiteHeader treatments={navTreatments} cities={navCities} />
      <main id="contenido">{children}</main>
      <SiteFooter treatments={navTreatments} cities={navCities} />
      <CookieNotice />
    </>
  );
}
