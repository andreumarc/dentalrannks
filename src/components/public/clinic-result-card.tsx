"use client";

import Link from "next/link";
import { Phone, MapPin, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { formatDistance } from "@/lib/geo";
import { initials, cn } from "@/lib/utils";
import { trackedHref } from "@/lib/tracking";
import { LeadDialogButton } from "@/components/public/lead-dialog";
import { ScoreBadge } from "@/components/public/score-badge";
import type { ResultClinic } from "@/server/search";
import type { LeadSource } from "@prisma/client";

export function ClinicResultCard({
  clinic,
  rank,
  marketId,
  treatmentId,
  cityId,
  source = "SEARCH_RESULTS",
  hovered = false,
  onHover,
}: {
  clinic: ResultClinic;
  rank: number;
  marketId?: string | null;
  treatmentId?: string | null;
  cityId?: string | null;
  source?: LeadSource;
  hovered?: boolean;
  onHover?: (id: string | null) => void;
}) {
  const profileHref = trackedHref({
    clinicId: clinic.id,
    type: "PROFILE",
    target: `/clinica/${clinic.slug}`,
    marketId,
    treatmentId,
    cityId,
    position: clinic.position,
    sponsored: clinic.sponsored,
  });

  const phoneHref = trackedHref({
    clinicId: clinic.id,
    type: "PHONE",
    target: `tel:${clinic.phone}`,
    marketId,
    treatmentId,
    cityId,
    position: clinic.position,
    sponsored: clinic.sponsored,
  });

  return (
    <Card
      accent={clinic.sponsored}
      onMouseEnter={() => onHover?.(clinic.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "flex flex-col gap-4 p-5 transition-shadow sm:flex-row sm:items-start",
        hovered && "shadow-card ring-1 ring-cyan-brand",
      )}
    >
      <Link href={profileHref} className="shrink-0" aria-label={`Ver ficha de ${clinic.name}`}>
        {clinic.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clinic.logoUrl}
            alt=""
            className="size-16 rounded-brand border border-line object-cover"
          />
        ) : (
          <span className="grid size-16 place-items-center rounded-brand border border-line bg-mist font-display text-[17px] font-semibold text-anthracite">
            {initials(clinic.name)}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {clinic.sponsored ? (
            <Badge variant="solid">Patrocinado</Badge>
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-grey-light">
              #{rank}
            </span>
          )}
          {clinic.verified ? (
            <Badge variant="cyan">
              <BadgeCheck className="size-3" aria-hidden="true" /> Clínica verificada
            </Badge>
          ) : null}
          {clinic.firstVisitFree ? <Badge variant="positive">Primera visita gratis</Badge> : null}
          {clinic.financing ? <Badge variant="neutral">Financiación</Badge> : null}
        </div>

        <Link href={profileHref} className="mt-2 block">
          <h3 className="font-display text-[18px] font-semibold uppercase tracking-[0.02em] text-ink hover:text-cyan-deep">
            {clinic.name}
          </h3>
        </Link>

        <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-grey">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {clinic.address}, {clinic.cityName}
          {clinic.distanceKm !== null ? (
            <span className="text-grey-light"> · a {formatDistance(clinic.distanceKm)}</span>
          ) : null}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <Stars rating={clinic.externalRating} count={clinic.externalReviewCount || undefined} />
          <ScoreBadge score={clinic.dentalRankScore} />
        </div>

        {clinic.highlights.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {clinic.highlights.map((h) => (
              <li key={h}>
                <Badge variant="outline">{h}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {clinic.priceFromCents !== null ? (
          <p className="mt-3 font-display text-[15px] font-semibold text-anthracite">
            Desde {formatCents(clinic.priceFromCents)}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2.5">
          <LeadDialogButton
            clinicId={clinic.id}
            clinicName={clinic.name}
            treatmentId={treatmentId}
            cityId={cityId}
            marketId={marketId}
            source={source}
            position={clinic.position}
            sponsored={clinic.sponsored}
            label="Solicitar valoración"
          />
          <Button asChild variant="outline">
            <a href={phoneHref}>
              <Phone className="size-4" aria-hidden="true" /> Llamar
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
