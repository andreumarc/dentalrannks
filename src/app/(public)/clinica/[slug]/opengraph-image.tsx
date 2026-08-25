import { ImageResponse } from "next/og";
import { renderOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/seo/og-image";
import { prisma } from "@/lib/prisma";

export const alt = "Ficha de clínica dental en DentalRank";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type Params = { slug: string };

/**
 * Imagen OpenGraph de la ficha de clínica. Usa la plantilla de marca
 * (`renderOgImage`), no `coverUrl`: esa URL es un campo de texto libre que
 * la propia clínica puede rellenar con un dominio arbitrario y sin control
 * de tamaño, así que no es un origen fiable para generar una imagen
 * consistente. Todo el cuerpo va envuelto en `try/catch`, igual que el
 * resto de imágenes OG dinámicas del sitio: un fallo al leer la clínica o
 * al renderizar con Satori no debe tumbar la generación de la página.
 */
export default async function Image({ params }: { params: Promise<Params> }) {
  try {
    const { slug } = await params;
    const clinic = await prisma.clinic.findFirst({
      where: { slug },
      select: {
        name: true,
        verificationStatus: true,
        city: { select: { name: true } },
      },
    });

    const title = clinic ? `${clinic.name} — ${clinic.city.name}` : "DentalRank";
    const subtitle =
      clinic?.verificationStatus === "VERIFIED"
        ? "Clínica verificada. Compara tratamientos, precio orientativo y reseñas."
        : "Compara tratamientos, precio orientativo y reseñas. Solicita valoración sin coste.";

    return renderOgImage({ title, subtitle });
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
