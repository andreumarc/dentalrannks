import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, LineChart, ShieldOff, ClipboardList } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { decideStaticIndexing } from "@/lib/seo/indexing";
import { paths } from "@/lib/seo/urls";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { SITE_URL } from "@/lib/seo/config";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoNote } from "@/components/ui/states";
import { FaqSection } from "@/components/public/seo/faq-section";
import { faqPageJsonLd } from "@/components/public/seo/faq-jsonld";
import type { FaqItem } from "@/components/public/seo/copy";

export async function generateMetadata(): Promise<Metadata> {
  const decision = decideStaticIndexing(paths.howItWorks());
  return buildMetadata({
    // Sin "DentalRank" en el título: el `title.template` del layout raíz ya
    // añade " | DentalRank" al renderizar, así que incluirlo aquí también
    // duplicaría la marca en el <title> del SERP.
    title: "Cómo funciona",
    description:
      "Cómo funcionan las posiciones patrocinadas, el DentalRank Score y la solicitud de valoración en DentalRank.",
    path: paths.howItWorks(),
    index: decision.index,
    follow: decision.follow,
  });
}

// Preguntas construidas a partir de lo que ya afirma el cuerpo de esta
// misma página (posición patrocinada, DentalRank Score, solicitud de
// valoración): ningún dato nuevo, solo el mismo contenido en formato FAQ
// para que también responda directamente en el buscador.
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "¿Pagar por una posición patrocinada mejora el DentalRank Score de una clínica?",
    answer:
      "No. Son dos escalas independientes que nunca se mezclan: la posición patrocinada es publicidad pagada y se etiqueta siempre como tal; el DentalRank Score no depende en ningún componente del dinero pagado por publicidad.",
  },
  {
    question: "¿Cuesta algo solicitar valoración a una clínica en DentalRank?",
    answer:
      "No, es gratuito y no compromete a nada. Tus datos de contacto se envían solo a la clínica que elijas, para que pueda llamarte y concretar una cita.",
  },
  {
    question: "¿DentalRank presta servicios sanitarios o hace diagnósticos?",
    answer:
      "No. DentalRank es un comparador: no presta servicios sanitarios, no forma parte del equipo clínico de ninguna clínica y no emite diagnósticos, recomendaciones clínicas ni valoraciones médicas.",
  },
];

export default function HowItWorksPage() {
  const originUrl = SITE_URL;
  const breadcrumbItems = [{ label: "Inicio", href: paths.home() }, { label: "Cómo funciona" }];
  const faqJsonLd = faqPageJsonLd(FAQ_ITEMS);

  return (
    <div className="wrap section max-w-[860px]">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, originUrl)} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      <Breadcrumbs items={breadcrumbItems} />

      <header className="mb-10">
        <p className="kicker mb-3">Cómo funciona</p>
        <h1 className="display-h1 text-ink">El modelo de DentalRank, explicado sin letra pequeña</h1>
        <p className="mt-4 text-[16px] text-grey">
          DentalRank es un comparador. Ayudamos a pacientes a encontrar clínica y a clínicas a
          conseguir pacientes. Así es como se ordenan los resultados y de dónde sale el dinero.
        </p>
      </header>

      <section className="mb-12">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-brand bg-cyan-brand text-white">
            <Megaphone className="size-5" aria-hidden="true" />
          </span>
          <h2 className="display-h3 text-anthracite">Posiciones patrocinadas</h2>
        </div>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink/90">
          <p>
            Para cada combinación de tratamiento y municipio (por ejemplo, «implantes en
            Barcelona») existe un mercado. Las clínicas pueden pujar por aparecer entre las
            primeras posiciones de ese mercado.
          </p>
          <p>
            La posición se calcula siempre en nuestro servidor, por importe pujado; en caso de
            empate, gana quien alcanzó ese importe primero. El resultado se etiqueta siempre con{" "}
            <Badge variant="solid">Patrocinado</Badge> y aparece en un bloque separado, antes de
            los resultados no patrocinados.
          </p>
          <InfoNote tone="warning">
            Pagar por una posición patrocinada no mejora el DentalRank Score de la clínica, no
            oculta información negativa y no es una garantía ni una recomendación clínica de
            DentalRank.
          </InfoNote>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-brand bg-anthracite text-white">
            <LineChart className="size-5" aria-hidden="true" />
          </span>
          <h2 className="display-h3 text-anthracite">DentalRank Score</h2>
        </div>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink/90">
          <p>
            El DentalRank Score es una puntuación de 0 a 100 que resume la calidad de la ficha y
            del servicio: verificación de la clínica, reseñas y su volumen, tiempo medio de
            respuesta a solicitudes, y lo completa que está la información publicada
            (tratamientos, fotos, horario, equipo).
          </p>
          <p>
            Ningún componente del cálculo depende del importe pagado por publicidad. Los
            resultados no patrocinados se ordenan primero por verificación, después por
            DentalRank Score y, por último, por proximidad.
          </p>
          <InfoNote tone="cyan">
            El DentalRank Score no es un juicio clínico ni una certificación sanitaria. No
            evaluamos la calidad del tratamiento dental en sí: evaluamos la información y el
            servicio que la clínica pone a disposición del paciente.
          </InfoNote>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-brand bg-mist text-anthracite">
            <ClipboardList className="size-5" aria-hidden="true" />
          </span>
          <h2 className="display-h3 text-anthracite">Solicitar valoración</h2>
        </div>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink/90">
          <p>
            Cuando solicitas valoración, tus datos de contacto se envían a la clínica que
            elijas para que te llame. Es gratuito para ti. No pedimos datos sobre tu salud: solo
            lo necesario para que la clínica pueda contactarte y concretar una cita.
          </p>
          <p>
            Pedimos dos consentimientos por separado: uno para enviar tus datos a la clínica
            (obligatorio para tramitar la solicitud) y otro, opcional, para recibir
            comunicaciones comerciales de DentalRank.
          </p>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-brand bg-mist text-anthracite">
            <ShieldOff className="size-5" aria-hidden="true" />
          </span>
          <h2 className="display-h3 text-anthracite">Lo que DentalRank no hace</h2>
        </div>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink/90">
          <li>No presta servicios sanitarios ni forma parte del equipo clínico de ninguna clínica.</li>
          <li>No emite diagnósticos, recomendaciones clínicas ni valoraciones médicas.</li>
          <li>No permite que el dinero pagado altere el DentalRank Score.</li>
          <li>No comparte tus datos con más de una clínica sin tu consentimiento explícito por cada solicitud.</li>
        </ul>
      </section>

      <FaqSection id="faq" heading="Preguntas frecuentes" items={FAQ_ITEMS} />

      <div className="mt-12 flex flex-wrap gap-3 border-t border-line pt-8">
        <Button asChild>
          <Link href={paths.home()}>Buscar clínica</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={paths.forClinics()}>Información para clínicas</Link>
        </Button>
      </div>
    </div>
  );
}
