import { ImageResponse } from "next/og";
import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/seo/og-image";
import { getCityBySlug } from "@/server/catalog";

export const alt = "Clínicas dentales por municipio en DentalRank";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type Params = { city: string };

/**
 * Imagen OpenGraph de la página de municipio. Todo el cuerpo va envuelto en
 * `try/catch`: un fallo al leer el municipio, o al renderizar con Satori,
 * no debe tumbar la generación de la página — se sirve una imagen mínima de
 * respaldo, igual que en la home.
 */
export default async function Image({ params }: { params: Promise<Params> }) {
  try {
    const { city: citySlug } = await params;
    const city = await getCityBySlug(citySlug);

    const title = city ? `Dentistas en ${city.name}` : "DentalRank";
    return renderOgImage({
      title,
      subtitle: "Compara clínicas dentales, valoraciones y precio orientativo.",
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
