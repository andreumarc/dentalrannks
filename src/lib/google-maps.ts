/**
 * Cargador perezoso y compartido de la Google Maps JavaScript API.
 *
 * Inyecta el `<script>` una única vez por página (promesa cacheada en el
 * módulo, no un `<script>` por instancia de mapa) y resuelve con el
 * espacio de nombres `google.maps` una vez inicializado. Usa `loading=async`
 * y carga la librería `marker` para poder usar `AdvancedMarkerElement`
 * cuando el mapa tenga `mapId`.
 *
 * No añade ninguna dependencia npm: el script se inyecta a mano.
 */

let loadPromise: Promise<typeof google.maps> | null = null;
let callbackCounter = 0;

export function loadGoogleMaps(apiKey: string): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadGoogleMaps solo puede ejecutarse en el cliente"));
  }
  if (!apiKey) {
    return Promise.reject(new Error("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("dentalrank-google-maps-script");
    if (existing) {
      // Ya hay una carga en curso desde otra instancia montada antes de que
      // esta promesa se cacheara (StrictMode / navegación rápida): espera a
      // que termine escuchando el propio evento load del script existente.
      existing.addEventListener("load", () => {
        if (window.google?.maps) resolve(window.google.maps);
        else reject(new Error("Google Maps no se inicializó correctamente"));
      });
      existing.addEventListener("error", () => {
        loadPromise = null;
        reject(new Error("No se pudo cargar Google Maps"));
      });
      return;
    }

    callbackCounter += 1;
    const callbackName = `__dentalrankGoogleMapsInit${callbackCounter}`;

    (window as unknown as Record<string, () => void>)[callbackName] = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps no se inicializó correctamente"));
    };

    const script = document.createElement("script");
    script.id = "dentalrank-google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=marker&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
