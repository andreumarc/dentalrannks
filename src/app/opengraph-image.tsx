import { ImageResponse } from "next/og";
import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/seo/og-image";

export const alt = "DentalRank — compara clínicas dentales y solicita valoración sin coste";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

// Imagen OpenGraph de la home. Un fallo aquí (por ejemplo, un cambio futuro
// en `renderOgImage` que introduzca CSS no soportado por Satori) no debe
// tumbar el build: el `catch` construye una `ImageResponse` mínima a mano,
// sin volver a pasar por `renderOgImage`, para no arriesgarse a repetir el
// mismo fallo.
export default function Image() {
  try {
    return renderOgImage({
      title: "Encuentra tu clínica dental",
      subtitle: "Compara clínicas por ubicación y tratamiento. Solicita valoración sin coste.",
    });
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#393F42",
            color: "#FFFFFF",
            fontSize: "72px",
            fontFamily: "sans-serif",
          }}
        >
          DentalRank
        </div>
      ),
      { ...OG_IMAGE_SIZE },
    );
  }
}
