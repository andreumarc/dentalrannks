"use client";

import { useMemo, useState } from "react";
import { ClinicMap } from "@/components/public/clinic-map";
import { ClinicResultCard } from "@/components/public/clinic-result-card";
import { SponsoredExplainer, OrganicExplainer } from "@/components/public/sponsored-note";
import { EmptyState } from "@/components/ui/states";
import type { ResultClinic } from "@/server/search";
import type { LeadSource } from "@prisma/client";
import { Search } from "lucide-react";

export function ResultsWithMap({
  sponsored,
  organic,
  center,
  marketId,
  treatmentId,
  cityId,
  cityName,
}: {
  sponsored: ResultClinic[];
  organic: ResultClinic[];
  center: { lat: number; lng: number };
  marketId: string | null;
  treatmentId: string;
  cityId: string;
  cityName: string;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const all = [...sponsored, ...organic];
  const source: LeadSource = "SEARCH_RESULTS";

  const mapClinics = useMemo(
    () =>
      all.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        lat: c.lat,
        lng: c.lng,
        sponsored: c.sponsored,
        position: c.position,
        rating: c.externalRating,
        reviewCount: c.externalReviewCount,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sponsored, organic],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <div className="min-w-0">
        {sponsored.length > 0 ? (
          <section aria-labelledby="sponsored-heading" className="mb-9">
            <h2 id="sponsored-heading" className="display-h3 mb-3 text-anthracite">
              Clínicas patrocinadas
            </h2>
            <div className="mb-4">
              <SponsoredExplainer />
            </div>
            <div className="space-y-4">
              {sponsored.map((c, i) => (
                <ClinicResultCard
                  key={c.id}
                  clinic={c}
                  rank={i + 1}
                  marketId={marketId}
                  treatmentId={treatmentId}
                  cityId={cityId}
                  source={source}
                  hovered={hoveredId === c.id}
                  onHover={setHoveredId}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="organic-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="organic-heading" className="display-h3 text-anthracite">
              Resultados por DentalRank Score
            </h2>
            <OrganicExplainer />
          </div>

          {organic.length === 0 && sponsored.length === 0 ? (
            <EmptyState
              icon={<Search className="size-5" />}
              title="Todavía no hay clínicas para esta búsqueda"
              description={`No tenemos clínicas publicadas en ${cityName} para este tratamiento. Prueba con un municipio cercano o consulta el listado completo de clínicas de la zona.`}
            />
          ) : organic.length === 0 ? (
            <p className="text-[14px] text-grey">No hay más clínicas para mostrar.</p>
          ) : (
            <div className="space-y-4">
              {organic.map((c, i) => (
                <ClinicResultCard
                  key={c.id}
                  clinic={c}
                  rank={i + 1}
                  marketId={marketId}
                  treatmentId={treatmentId}
                  cityId={cityId}
                  source={source}
                  hovered={hoveredId === c.id}
                  onHover={setHoveredId}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <ClinicMap
          clinics={mapClinics}
          center={center}
          hoveredId={hoveredId}
          onHoverPin={setHoveredId}
          context={{ marketId, treatmentId, cityId }}
          ariaLabel={`Mapa de clínicas en ${cityName}`}
        />
      </div>
    </div>
  );
}
