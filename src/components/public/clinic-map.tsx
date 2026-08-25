"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadGoogleMaps } from "@/lib/google-maps";
import { trackedHref } from "@/lib/tracking";

export type MapPinData = {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  sponsored?: boolean;
  position?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
};

const SPONSORED_COLOR = "#01ADD0";
const DEFAULT_COLOR = "#393F42";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined;

/** Estilo discreto de marca: poco ruido de POI/transporte, tonos fríos. */
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f8f9" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7478" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e7f7fc" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#e2e8ea" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#dfe6e8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#c5ced1" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cdeaf3" }] },
];

/** URL de búsqueda de Google Maps que no requiere clave de API. */
function googleMapsSearchUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function markerLabel(p: MapPinData, index: number): string {
  return p.sponsored && p.position ? String(p.position) : String(index + 1);
}

function pinIconUrl(color: string, highlighted: boolean): string {
  const size = highlighted ? 34 : 26;
  const ring = highlighted
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="none" stroke="#01ADD0" stroke-width="2" opacity="0.55"/>`
    : "";
  const r = highlighted ? size / 2 - 5 : size / 2 - 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${ring}<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}" stroke="#fff" stroke-width="2"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildAdvancedPinElement(color: string, label: string, name: string): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", `Marcador de ${name}`);
  el.style.cssText =
    "display:flex;align-items:center;justify-content:center;width:26px;height:26px;" +
    `border-radius:9999px;background:${color};color:#fff;` +
    "font:700 11px var(--font-mono,ui-monospace,monospace);border:2px solid #fff;" +
    "box-shadow:0 2px 6px rgba(34,39,42,.35);cursor:pointer;" +
    "transition:transform .15s ease, box-shadow .15s ease;";
  el.textContent = label;
  return el;
}

function setAdvancedPinHighlighted(el: HTMLDivElement, highlighted: boolean): void {
  el.style.transform = highlighted ? "scale(1.3)" : "scale(1)";
  el.style.boxShadow = highlighted
    ? "0 0 0 4px rgba(1,173,208,.35), 0 4px 10px rgba(34,39,42,.4)"
    : "0 2px 6px rgba(34,39,42,.35)";
  el.style.zIndex = highlighted ? "30" : "10";
}

function infoWindowContent(
  p: MapPinData,
  context?: { marketId?: string | null; treatmentId?: string | null; cityId?: string | null },
): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = "font-family:var(--font-sans,Outfit,system-ui,sans-serif);min-width:180px;padding:2px;";

  const title = document.createElement("p");
  title.textContent = p.name;
  title.style.cssText = "margin:0 0 4px;font-weight:600;font-size:14px;color:#22272A;";
  wrap.appendChild(title);

  if (typeof p.rating === "number") {
    const rating = document.createElement("p");
    const count = typeof p.reviewCount === "number" && p.reviewCount > 0 ? ` (${p.reviewCount} reseñas)` : "";
    rating.textContent = `★ ${p.rating.toFixed(1).replace(".", ",")}${count}`;
    rating.style.cssText = "margin:0 0 8px;font-size:12.5px;color:#6B7478;";
    wrap.appendChild(rating);
  } else {
    wrap.style.marginBottom = "8px";
  }

  const link = document.createElement("a");
  link.href = trackedHref({
    clinicId: p.id,
    type: "PROFILE",
    target: `/clinica/${p.slug}`,
    marketId: context?.marketId,
    treatmentId: context?.treatmentId,
    cityId: context?.cityId,
    position: p.position ?? null,
    sponsored: p.sponsored,
  });
  link.textContent = "Ver ficha →";
  link.style.cssText = "display:inline-block;margin-top:4px;font-size:12.5px;font-weight:600;color:#0189A5;text-decoration:none;";

  wrap.appendChild(link);
  return wrap;
}

type MarkerEntry = {
  id: string;
  highlight: (highlighted: boolean) => void;
  destroy: () => void;
};

/**
 * Mapa de clínicas basado en Google Maps.
 *
 * Carga la API de forma perezosa (una vez por página, ver `src/lib/google-maps.ts`)
 * y solo si hay `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` configurada. Sin clave, o si la
 * carga falla, se muestra un estado de respaldo con la lista de clínicas y un
 * enlace a Google Maps por clínica que no requiere clave.
 */
export function ClinicMap({
  clinics,
  center,
  hoveredId,
  onHoverPin,
  context,
  className,
  ariaLabel,
}: {
  clinics: MapPinData[];
  center: { lat: number; lng: number };
  hoveredId?: string | null;
  onHoverPin?: (id: string | null) => void;
  context?: {
    marketId?: string | null;
    treatmentId?: string | null;
    cityId?: string | null;
  };
  className?: string;
  ariaLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);

  const [status, setStatus] = useState<"missing-key" | "loading" | "ready" | "error">(
    API_KEY ? "loading" : "missing-key",
  );

  const label = ariaLabel ?? "Mapa de clínicas en la zona";

  // Firma estable de los puntos a pintar: evita reconstruir marcadores cuando
  // el padre vuelve a renderizar (por ejemplo al cambiar hoveredId) pero los
  // datos de las clínicas no han cambiado realmente.
  const pointsSignature = useMemo(
    () =>
      clinics
        .map((c) => `${c.id}:${c.lat.toFixed(6)}:${c.lng.toFixed(6)}:${c.sponsored ? 1 : 0}:${c.position ?? ""}`)
        .join("|"),
    [clinics],
  );
  const centerKey = `${center.lat.toFixed(6)},${center.lng.toFixed(6)}`;

  // Monta el mapa una única vez.
  useEffect(() => {
    if (!API_KEY || !containerRef.current) return;
    let cancelled = false;

    loadGoogleMaps(API_KEY)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center,
          zoom: 13,
          mapId: MAP_ID,
          styles: MAP_ID ? undefined : MAP_STYLES,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "cooperative",
          zoomControl: true,
          fullscreenControl: true,
        });
        infoWindowRef.current = new maps.InfoWindow();
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // Solo al montar: el mapa se crea una vez y luego se actualiza in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconstruye los marcadores cuando cambian los puntos o el mapa está listo.
  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.google?.maps) return;
    const maps = window.google.maps;
    const map = mapRef.current;

    for (const entry of markersRef.current) entry.destroy();
    markersRef.current = [];

    if (clinics.length === 0) {
      map.setCenter(center);
      map.setZoom(12);
      return;
    }

    if (clinics.length === 1) {
      map.setCenter({ lat: clinics[0].lat, lng: clinics[0].lng });
      map.setZoom(16);
    } else {
      const bounds = new maps.LatLngBounds();
      for (const c of clinics) bounds.extend({ lat: c.lat, lng: c.lng });
      map.fitBounds(bounds, 56);
    }

    const useAdvanced = Boolean(MAP_ID && maps.marker?.AdvancedMarkerElement);

    markersRef.current = clinics.map((p, i) => {
      const color = p.sponsored ? SPONSORED_COLOR : DEFAULT_COLOR;
      const text = markerLabel(p, i);

      const openInfoWindow = (anchor: google.maps.Marker | google.maps.marker.AdvancedMarkerElement) => {
        const iw = infoWindowRef.current;
        if (!iw) return;
        iw.setContent(infoWindowContent(p, context));
        iw.open({ map, anchor });
      };

      if (useAdvanced) {
        const pinEl = buildAdvancedPinElement(color, text, p.name);
        const advanced = new maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: p.lat, lng: p.lng },
          content: pinEl,
          title: p.name,
          zIndex: 10,
        });
        // AdvancedMarkerElement solo emite 'click' como evento gmp propio; el
        // hover se escucha directamente en el elemento DOM del contenido.
        const onEnter = () => onHoverPin?.(p.id);
        const onLeave = () => onHoverPin?.(null);
        pinEl.addEventListener("mouseenter", onEnter);
        pinEl.addEventListener("mouseleave", onLeave);
        const listeners = [advanced.addListener("click", () => openInfoWindow(advanced))];

        return {
          id: p.id,
          highlight: (h: boolean) => setAdvancedPinHighlighted(pinEl, h),
          destroy: () => {
            for (const l of listeners) l.remove();
            pinEl.removeEventListener("mouseenter", onEnter);
            pinEl.removeEventListener("mouseleave", onLeave);
            advanced.map = null;
          },
        };
      }

      const marker = new maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map,
        title: p.name,
        zIndex: 10,
        icon: {
          url: pinIconUrl(color, false),
          scaledSize: new maps.Size(26, 26),
          anchor: new maps.Point(13, 13),
        },
        label: {
          text,
          color: "#fff",
          fontSize: "11px",
          fontWeight: "700",
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
        },
      });
      const listeners = [
        marker.addListener("click", () => openInfoWindow(marker)),
        marker.addListener("mouseover", () => onHoverPin?.(p.id)),
        marker.addListener("mouseout", () => onHoverPin?.(null)),
      ];

      return {
        id: p.id,
        highlight: (h: boolean) => {
          const size = h ? 34 : 26;
          marker.setIcon({
            url: pinIconUrl(color, h),
            scaledSize: new maps.Size(size, size),
            anchor: new maps.Point(size / 2, size / 2),
          });
          marker.setZIndex(h ? 30 : 10);
        },
        destroy: () => {
          for (const l of listeners) l.remove();
          marker.setMap(null);
        },
      };
    });

    return () => {
      for (const entry of markersRef.current) entry.destroy();
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, pointsSignature, centerKey]);

  // Sincroniza el resaltado con hoveredId sin reconstruir los marcadores.
  useEffect(() => {
    for (const entry of markersRef.current) entry.highlight(entry.id === hoveredId);
  }, [hoveredId]);

  // Desmontaje: limpia marcadores y listeners.
  useEffect(() => {
    return () => {
      for (const entry of markersRef.current) entry.destroy();
      markersRef.current = [];
      if (infoWindowRef.current) infoWindowRef.current.close();
    };
  }, []);

  const showFallback = status === "missing-key" || status === "error";

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-brand border border-line bg-mist sm:aspect-[16/11]",
        className,
      )}
    >
      {showFallback ? (
        <MapFallback clinics={clinics} reason={status === "missing-key" ? "missing-key" : "error"} label={label} />
      ) : (
        <div ref={containerRef} role="application" aria-label={label} className="size-full" />
      )}

      {!showFallback && clinics.length === 0 ? (
        <p className="pointer-events-none absolute inset-x-4 bottom-3 rounded-brand bg-white/90 px-3 py-2 text-center text-[12.5px] text-grey">
          Sin clínicas geolocalizadas todavía.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Estado de respaldo: sin clave configurada, o si la carga del script falla,
 * nunca se rompe la página. Muestra la lista de clínicas con un enlace a
 * Google Maps por clínica (no requiere clave) y es completamente navegable
 * con teclado, al ser una lista de enlaces normales.
 */
function MapFallback({
  clinics,
  reason,
  label,
}: {
  clinics: MapPinData[];
  reason: "missing-key" | "error";
  label: string;
}) {
  return (
    <div className="flex size-full flex-col gap-3 overflow-y-auto p-4" role="group" aria-label={label}>
      <div className="flex items-center gap-2 text-anthracite">
        <MapPinOff className="size-4 shrink-0" aria-hidden="true" />
        <p className="font-display text-[12.5px] font-semibold uppercase tracking-[0.04em]">
          Mapa no disponible
        </p>
      </div>

      {clinics.length === 0 ? (
        <p className="text-[13px] text-grey">Sin clínicas geolocalizadas todavía.</p>
      ) : (
        <ul className="space-y-2">
          {clinics.map((c) => (
            <li key={c.id} className="rounded-brand border border-line bg-white px-3 py-2.5">
              <p className="text-[13.5px] font-medium text-ink">{c.name}</p>
              <a
                href={googleMapsSearchUrl(c.lat, c.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-cyan-deep hover:text-cyan-brand"
              >
                Ver en Google Maps <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-auto text-[11px] text-grey-light">
        {reason === "missing-key"
          ? "Falta configurar NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para mostrar el mapa interactivo."
          : "No se ha podido cargar el mapa interactivo en este momento."}
      </p>
    </div>
  );
}
