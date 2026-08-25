import { ImageResponse } from "next/og";
import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/seo/og-image";
import { getTreatmentBySlug } from "@/server/catalog";

export const alt = "Comparativa de clínicas dentales por tratamiento en DentalRank";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type Params = { treatment: string };

/**
 * Imagen OpenGraph de la página informacional de tratamiento. Todo el
 * cuerpo va envuelto en `try/catch`: un fallo al leer el tratamiento, o al
 * renderizar con Satori, no debe tumbar la generación de la página — se
 * sirve una imagen mínima de respaldo, igual que en el resto del sitio.
 */
export default async function Image({ params }: { params: Promise<Params> }) {
  try {
    const { treatment: treatmentSlug } = await params;
    const treatment = await getTreatmentBySlug(treatmentSlug);

    const title = treatment ? treatment.name : "DentalRank";
    return renderOgImage({
      title,
      subtitle: "Qué es, qué compone el precio y clínicas por municipio en España.",
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
