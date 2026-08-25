import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { getTreatmentCategories } from "@/server/catalog";
import { safeRead } from "@/lib/safe";
import { buildMetadata } from "@/lib/seo/metadata";
import { decideStaticIndexing } from "@/lib/seo/indexing";
import { paths } from "@/lib/seo/urls";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { SITE_URL } from "@/lib/seo/config";
import { formatNumber } from "@/lib/money";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { EmptyState } from "@/components/ui/states";
import { TreatmentIconTile } from "@/components/ui/treatment-icon";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const decision = decideStaticIndexing(paths.treatmentHub());
  return buildMetadata({
    title: "Tratamientos dentales: todos los tratamientos por categoría",
    description:
      "Todos los tratamientos dentales publicados en DentalRank, agrupados por categoría. Consulta cada uno y compara clínicas por municipio.",
    path: paths.treatmentHub(),
    index: decision.index,
    follow: decision.follow,
  });
}

export default async function TreatmentsIndexPage() {
  const categories = await safeRead(getTreatmentCategories, [], "tratamientos");
  const categoriesWithTreatments = categories.filter((cat) => cat.treatments.length > 0);
  const totalTreatments = categoriesWithTreatments.reduce((sum, cat) => sum + cat.treatments.length, 0);

  const originUrl = SITE_URL;
  const breadcrumbItems = [{ label: "Inicio", href: paths.home() }, { label: "Tratamientos" }];
  const treatmentsItemListJsonLd = itemListJsonLd(
    categoriesWithTreatments.flatMap((cat) =>
      cat.treatments.map((t) => ({ url: `${originUrl}${paths.treatment(t.slug)}`, name: t.name })),
    ),
  );

  return (
    <div className="wrap section">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, originUrl)} />
      {treatmentsItemListJsonLd ? <JsonLd data={treatmentsItemListJsonLd} /> : null}

      <Breadcrumbs items={breadcrumbItems} />

      <header className="mb-10 max-w-[70ch]">
        <h1 className="display-h1 text-ink">Tratamientos dentales</h1>
        <p className="mt-3 text-[15.5px] text-grey">
          {totalTreatments > 0
            ? `${formatNumber(totalTreatments)} ${totalTreatments === 1 ? "tratamiento" : "tratamientos"} en ${formatNumber(categoriesWithTreatments.length)} ${categoriesWithTreatments.length === 1 ? "categoría" : "categorías"}. `
            : ""}
          Consulta en qué consiste cada tratamiento, qué compone su precio y qué clínicas lo ofrecen en cada
          municipio.
        </p>
      </header>

      {categoriesWithTreatments.length === 0 ? (
        <EmptyState
          icon={<Stethoscope className="size-5" />}
          title="Todavía no hay tratamientos publicados"
          description="En cuanto se publique la taxonomía de tratamientos, aparecerá aquí."
        />
      ) : (
        <div className="space-y-10">
          {categoriesWithTreatments.map((cat) => (
            <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
              <h2 id={`cat-${cat.id}`} className="display-h3 mb-4 text-anthracite">
                {cat.name}
              </h2>
              <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {cat.treatments.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={paths.treatment(t.slug)}
                      className="group flex items-center gap-3 rounded-brand border border-line p-2.5 pr-4 text-[14.5px] text-ink transition-colors hover:border-cyan-brand hover:text-cyan-deep"
                    >
                      <TreatmentIconTile
                        slug={t.slug}
                        category={cat.name}
                        size={28}
                        className="size-11 transition-colors group-hover:bg-cyan-brand group-hover:text-white"
                      />
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
