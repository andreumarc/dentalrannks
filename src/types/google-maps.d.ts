/**
 * Tipos mínimos y propios para el subconjunto de la Google Maps JavaScript API
 * que usa `src/lib/google-maps.ts` y `src/components/public/clinic-map.tsx`.
 *
 * El proyecto no añade `@types/google.maps` como dependencia npm (regla del
 * encargo): esta declaración ambiental cubre solo lo que se usa realmente.
 */

declare global {
  namespace google.maps {
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface Padding {
      top: number;
      right: number;
      bottom: number;
      left: number;
    }

    interface MapTypeStyler {
      [key: string]: string | number;
    }

    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers: MapTypeStyler[];
    }

    interface MapOptions {
      center?: LatLngLiteral;
      zoom?: number;
      mapId?: string;
      styles?: MapTypeStyle[];
      disableDefaultUI?: boolean;
      clickableIcons?: boolean;
      gestureHandling?: "cooperative" | "greedy" | "none" | "auto";
      zoomControl?: boolean;
      fullscreenControl?: boolean;
      streetViewControl?: boolean;
      mapTypeControl?: boolean;
    }

    class Map {
      constructor(el: HTMLElement, opts?: MapOptions);
      setCenter(center: LatLngLiteral): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
    }

    class LatLngBounds {
      constructor();
      extend(point: LatLngLiteral): LatLngBounds;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    interface Icon {
      url: string;
      scaledSize?: Size;
      anchor?: Point;
    }

    interface MarkerLabel {
      text: string;
      color?: string;
      fontSize?: string;
      fontWeight?: string;
      fontFamily?: string;
    }

    interface MarkerOptions {
      position: LatLngLiteral;
      map?: Map | null;
      icon?: Icon | string;
      label?: string | MarkerLabel;
      title?: string;
      zIndex?: number;
    }

    interface MapsEventListener {
      remove(): void;
    }

    class Marker {
      constructor(opts: MarkerOptions);
      setMap(map: Map | null): void;
      setIcon(icon: Icon | string): void;
      setLabel(label: string | MarkerLabel): void;
      setZIndex(zIndex: number): void;
      addListener(eventName: string, handler: () => void): MapsEventListener;
    }

    interface InfoWindowOptions {
      content?: string | Node;
      ariaLabel?: string;
      disableAutoPan?: boolean;
    }

    interface InfoWindowOpenOptions {
      map?: Map;
      anchor?: Marker | marker.AdvancedMarkerElement;
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(opts: InfoWindowOpenOptions): void;
      close(): void;
      setContent(content: string | Node): void;
      addListener(eventName: string, handler: () => void): MapsEventListener;
    }

    namespace marker {
      interface AdvancedMarkerElementOptions {
        map?: Map | null;
        position?: LatLngLiteral;
        content?: Element;
        title?: string;
        zIndex?: number;
      }

      class AdvancedMarkerElement {
        constructor(opts?: AdvancedMarkerElementOptions);
        map: Map | null;
        position: LatLngLiteral | null;
        content: Element | null;
        addListener(eventName: string, handler: () => void): MapsEventListener;
      }
    }
  }

  interface Window {
    google?: { maps: typeof google.maps };
  }
}

export {};
