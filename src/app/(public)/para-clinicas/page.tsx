import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Check, X, ArrowRight } from "lucide-react";
import { getCitiesWithClinics, getTreatments } from "@/server/catalog";
import { safeRead } from "@/lib/safe";
import { buildMetadata } from "@/lib/seo/metadata";
import { decideStaticIndexing } from "@/lib/seo/indexing";
import { paths } from "@/lib/seo/urls";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { SITE_URL } from "@/lib/seo/config";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaqSection } from "@/components/public/seo/faq-section";
import { faqPageJsonLd } from "@/components/public/seo/faq-jsonld";
import type { FaqItem } from "@/components/public/seo/copy";
import { formatCentsCompact, formatNumber } from "@/lib/money";
import { MARKET_DEFAULTS, MIN_TOPUP_EUROS, CLICK_DEDUPE_MINUTES, LEAD_DEDUPE_HOURS } from "@/lib/pricing";
import { photo } from "@/lib/images";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const decision = decideStaticIndexing(paths.forClinics());
  return buildMetadata({
    title: "Cómo funciona para clínicas",
    description:
      "Da de alta tu clínica gratis y aparece en el comparador. Cuando quieras estar en las primeras posiciones de tu ciudad y tratamiento, pujas por ellas y mides lo que te cuesta cada paciente.",
    path: paths.forClinics(),
    index: decision.index,
    follow: decision.follow,
  });
}

/* -------------------------------------------------------------------------- */
/* Contenido                                                                   */
/* -------------------------------------------------------------------------- */

const PASOS = [
  {
    fase: "Gratis",
    title: "Das de alta tu clínica",
    body:
      "Un formulario con los datos del centro, tu contacto y los tratamientos que ofreces. No se pide tarjeta ni hay permanencia.",
  },
  {
    fase: "Gratis",
    title: "Revisamos y publicamos la ficha",
    body:
      "Comprobamos que la información es coherente antes de que aparezca en el comparador. Si aportas razón social, CIF, dirección y persona responsable, obtienes el distintivo de clínica verificada.",
  },
  {
    fase: "Gratis",
    title: "Empiezas a aparecer y a recibir solicitudes",
    body:
      "Tu ficha entra en los resultados de tu municipio y de cada tratamiento que ofreces. Si un paciente te elige, su solicitud llega a tu panel. Sin coste.",
  },
  {
    fase: "Gratis",
    title: "Subes tu DentalRank Score",
    body:
      "Completar la ficha, verificarte y responder rápido mejora tu posición entre los resultados no patrocinados. Esto no se compra: es la parte del orden que depende solo de tu trabajo.",
  },
  {
    fase: "De pago",
    title: "Eliges en qué mercados quieres estar arriba",
    body:
      "Un mercado es una combinación de tratamiento y municipio: «implantes en Barcelona» es uno, «invisalign en Barcelona» es otro. Eliges los que te interesan, no todo el país.",
  },
  {
    fase: "De pago",
    title: "Recargas saldo y comprometes un importe",
    body:
      "Recargas saldo cuando quieres y comprometes parte de él en un mercado concreto. Al comprometerlo se descuenta del saldo, y esa cifra es la que fija tu posición mientras la mantengas.",
  },
  {
    fase: "De pago",
    title: "Ves tu posición y decides si subir",
    body:
      "El panel te dice en qué puesto estás y exactamente cuánto hace falta para ocupar el siguiente. Sin subastas opacas: ves el número antes de pagar.",
  },
  {
    fase: "De pago",
    title: "Mides el coste por paciente y ajustas",
    body:
      "Cada solicitud se sigue por estados hasta el tratamiento aceptado. Sabes qué te cuesta un lead, una primera visita y un paciente, mercado a mercado.",
  },
];

const COMPARATIVA: { fila: string; gratis: boolean | string; pago: boolean | string }[] = [
  { fila: "Ficha completa con fotos, horarios, equipo y tratamientos", gratis: true, pago: true },
  { fila: "Aparecer en tu municipio y en tus tratamientos", gratis: true, pago: true },
  { fila: "Recibir solicitudes de pacientes", gratis: true, pago: true },
  { fila: "Distintivo de clínica verificada", gratis: "Si aportas la documentación", pago: "Si aportas la documentación" },
  { fila: "DentalRank Score", gratis: "Depende de tu ficha y tu servicio", pago: "Depende de tu ficha y tu servicio" },
  { fila: "Panel con leads, embudo y CRM", gratis: true, pago: true },
  { fila: "Posición entre los resultados no patrocinados", gratis: "Por Score y proximidad", pago: "Por Score y proximidad" },
  { fila: "Aparecer en las posiciones patrocinadas", gratis: false, pago: true },
  { fila: "Elegir en qué tratamiento y municipio destacar", gratis: false, pago: true },
  { fila: "Analítica de gasto, clics y coste por lead", gratis: false, pago: true },
];

const NO_COMPRA = [
  "El DentalRank Score. Ningún importe lo mueve, ni un céntimo.",
  "El distintivo de clínica verificada, que depende solo de la documentación.",
  "El orden de los resultados no patrocinados.",
  "Ocultar a un competidor ni bajarlo de posición.",
  "Que el paciente no vea que esa posición está pagada: siempre va etiquetada.",
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "¿Cuánto cuesta dar de alta mi clínica?",
    answer:
      "Nada. El alta, la ficha, aparecer en el comparador y recibir solicitudes de pacientes no tienen coste. Solo se paga si decides ocupar una posición patrocinada.",
  },
  {
    question: "¿Hay cuota mensual o permanencia?",
    answer:
      "No hay cuota fija ni permanencia. Se funciona con saldo: recargas cuando quieres y solo se consume cuando comprometes un importe en un mercado. Si no tienes ninguna puja activa, tu ficha gratuita sigue publicada igual.",
  },
  {
    question: "¿Cómo se decide quién aparece primero en las posiciones patrocinadas?",
    answer:
      `El importe comprometido en ese mercado, de mayor a menor. Si dos clínicas comprometen lo mismo, va antes la que llegó primero a esa cantidad. Hay ${MARKET_DEFAULTS.sponsoredSlots} posiciones patrocinadas por búsqueda.`,
  },
  {
    question: "¿Pagar más mejora mi DentalRank Score?",
    answer:
      "No. Son dos escalas separadas y así se le explica al paciente. El Score se calcula con la verificación de la clínica, las reseñas, el tiempo de respuesta y lo completa que esté la ficha. El dinero no entra en el cálculo.",
  },
  {
    question: "¿Qué pasa si recibo una solicitud falsa o duplicada?",
    answer:
      `No se cobra. Una solicitud repetida del mismo teléfono a la misma clínica en menos de ${LEAD_DEDUPE_HOURS} horas se marca como duplicada y entra a coste cero, y las que se revisan como inválidas o spam se abonan de vuelta a tu saldo.`,
  },
  {
    question: "¿Se me cobra si el mismo visitante hace clic varias veces?",
    answer:
      `No. En el modelo por defecto no se cobra por clic en absoluto, y en los mercados que sí facturan por clic los repetidos del mismo visitante dentro de una ventana de ${CLICK_DEDUPE_MINUTES} minutos quedan marcados como no válidos y no se facturan.`,
  },
  {
    question: "¿Puedo gestionar varias clínicas desde la misma cuenta?",
    answer:
      "Sí. Una organización puede tener varias clínicas y varios usuarios, cada uno con acceso solo a las que le corresponden. Está pensado para grupos dentales.",
  },
  {
    question: "¿Qué pasa con los datos de los pacientes que me llegan?",
    answer:
      "El paciente da su consentimiento expreso para que su solicitud llegue a la clínica que ha elegido, y solo a esa. Tu clínica pasa a ser responsable de esos datos para atender la solicitud; las obligaciones concretas están en las condiciones del servicio.",
  },
];

/* -------------------------------------------------------------------------- */

/**
 * Las filas se declaran con clases estáticas (y no con `style={{gridRowStart}}`)
 * para que Tailwind las incluya en el CSS generado y para que la colocación solo
 * se aplique a partir de `lg`, que es donde hay dos columnas que alinear.
 */
const FILAS = ["lg:row-start-2", "lg:row-start-3", "lg:row-start-4", "lg:row-start-5"] as const;

function PasoItem({
  numero,
  paso,
  fila,
  columna,
  colorNumero,
}: {
  numero: number;
  paso: { title: string; body: string };
  fila: number;
  columna: string;
  colorNumero: string;
}) {
  return (
    <li
      className={cn(
        "grid grid-cols-[38px_1fr] gap-4 border-t border-line py-6",
        columna,
        FILAS[fila],
      )}
    >
      <span className={cn("pt-1 font-display text-[26px] font-light leading-none", colorNumero)}>
        {String(numero).padStart(2, "0")}
      </span>
      <div>
        <h4 className="font-display text-[15px] font-semibold uppercase tracking-[0.04em] text-ink">
          {paso.title}
        </h4>
        <p className="mt-2 text-[14.5px] leading-relaxed text-grey">{paso.body}</p>
      </div>
    </li>
  );
}

function Marca({ valor }: { valor: boolean | string }) {
  if (valor === true) {
    return (
      <>
        <Check className="size-4 text-positive" aria-hidden="true" />
        <span className="sr-only">Incluido</span>
      </>
    );
  }
  if (valor === false) {
    return (
      <>
        <X className="size-4 text-grey-light" aria-hidden="true" />
        <span className="sr-only">No incluido</span>
      </>
    );
  }
  return <span className="text-[13.5px] text-grey">{valor}</span>;
}

export default async function ForClinicsPage() {
  const [cities, treatments] = await Promise.all([
    safeRead(getCitiesWithClinics, [], "para-clinicas:cities"),
    safeRead(getTreatments, [], "para-clinicas:treatments"),
  ]);

  const breadcrumbItems = [
    { label: "Inicio", href: paths.home() },
    { label: "Para clínicas" },
  ];
  const faqJsonLd = faqPageJsonLd(FAQ_ITEMS);
  const portada = photo("alineador-plan");

  const gratis = PASOS.filter((p) => p.fase === "Gratis");
  const pago = PASOS.filter((p) => p.fase === "De pago");

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, SITE_URL)} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}

      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-anthracite">
        {portada ? (
          <Image
            src={portada.src}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className="object-cover object-[70%_40%]"
          />
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(100deg,rgba(40,45,48,.95)_0%,rgba(40,45,48,.86)_42%,rgba(40,45,48,.55)_78%,rgba(40,45,48,.4)_100%)]"
        />
        <div className="relative py-16 sm:py-24">
          <div className="wrap">
            <Breadcrumbs items={breadcrumbItems} tone="onDark" className="mb-0" />
            <p className="kicker mt-6 text-cyan-soft">Para clínicas dentales</p>
            <h1 className="display-h1 mt-4 max-w-[19ch] text-white">
              Empieza gratis. Paga solo cuando quieras estar <em className="not-italic text-cyan-brand">arriba</em>.
            </h1>
            <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-grey-soft">
              Tu ficha en el comparador no cuesta nada y ya te trae solicitudes. Cuando quieras
              ocupar las primeras posiciones de un tratamiento en tu ciudad, pujas por ellas y ves
              exactamente lo que te cuesta cada paciente.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/alta-clinica">Dar de alta mi clínica</Link>
              </Button>
              <Button asChild variant="ghostWhite" size="lg">
                <Link href="#comparativa">Ver qué incluye cada opción</Link>
              </Button>
            </div>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-grey-soft">
              Sin cuota mensual · Sin permanencia · Sin tarjeta para empezar
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Proceso */}
      <section className="section" aria-labelledby="proceso">
        <div className="wrap">
          <p className="kicker">El proceso</p>
          <h2 id="proceso" className="display-h2 mt-3 text-ink">
            De ficha gratuita a primera posición
          </h2>
          <p className="mt-4 max-w-[62ch] text-[15.5px] text-grey">
            Ocho pasos en orden. Los cuatro primeros no cuestan nada y muchas clínicas se quedan
            ahí; los cuatro siguientes solo tienen sentido cuando ya sabes que el canal te funciona.
          </p>

          {/*
            Las dos columnas comparten la misma rejilla en vez de ser dos listas
            independientes: cada paso gratuito y su homólogo de pago caen en la
            misma fila, así que las líneas de separación y los bloques de texto
            quedan a la misma altura en ambas columnas por muy distinto que sea
            el largo de cada texto. En móvil (una sola columna) `display:
            contents` desaparece del reparto y los elementos fluyen en el orden
            del documento: primero el bloque gratuito completo, luego el de pago.
          */}
          <div className="mt-10 grid gap-x-12 lg:grid-cols-2">
            <h3 className="display-h3 flex items-center gap-3 text-anthracite lg:col-start-1 lg:row-start-1">
              <Badge variant="positive">Sin coste</Badge> Directorio
            </h3>
            <ol role="list" className="contents">
              {gratis.map((paso, i) => (
                <PasoItem
                  key={paso.title}
                  numero={i + 1}
                  paso={paso}
                  fila={i}
                  columna="lg:col-start-1"
                  colorNumero="text-positive"
                />
              ))}
            </ol>

            <h3 className="display-h3 mt-14 flex items-center gap-3 text-anthracite lg:col-start-2 lg:row-start-1 lg:mt-0">
              <Badge variant="solid">De pago</Badge> Patrocinio
            </h3>
            <ol role="list" className="contents">
              {pago.map((paso, i) => (
                <PasoItem
                  key={paso.title}
                  numero={i + 5}
                  paso={paso}
                  fila={i}
                  columna="lg:col-start-2"
                  colorNumero="text-cyan-deep"
                />
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Comparativa */}
      <section className="section bg-mist" aria-labelledby="comparativa-titulo" id="comparativa">
        <div className="wrap">
          <p className="kicker">Qué incluye cada opción</p>
          <h2 id="comparativa-titulo" className="display-h2 mt-3 text-ink">
            Gratis frente a patrocinado
          </h2>
          <p className="mt-4 max-w-[62ch] text-[15.5px] text-grey">
            Lo que cambia al pagar es dónde apareces, no quién eres. Todo lo que construye tu
            reputación en DentalRank sigue siendo gratuito.
          </p>

          <div className="scroll-x mt-10 rounded-brand border border-line bg-white">
            <table className="w-full border-collapse text-[15px]">
              <caption className="sr-only">
                Comparación entre la ficha gratuita y el patrocinio de posiciones
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="bg-anthracite px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.13em] text-white">
                    Prestación
                  </th>
                  <th scope="col" className="w-[190px] bg-anthracite px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.13em] text-white">
                    Ficha gratuita
                  </th>
                  <th scope="col" className="w-[190px] bg-cyan-brand px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.13em] text-white">
                    Con patrocinio
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIVA.map((row) => (
                  <tr key={row.fila} className="border-t border-line">
                    <td className="px-4 py-3 text-ink">{row.fila}</td>
                    <td className="px-4 py-3"><Marca valor={row.gratis} /></td>
                    <td className="bg-cyan-tint/40 px-4 py-3"><Marca valor={row.pago} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Puja */}
      <section className="section" aria-labelledby="puja">
        <div className="wrap">
          <p className="kicker">Cómo funciona la puja</p>
          <h2 id="puja" className="display-h2 mt-3 text-ink">
            Ves el número antes de pagarlo
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
            <div className="grid gap-6">
              <p className="text-[15.5px] leading-relaxed text-anthracite">
                Cada mercado —un tratamiento en un municipio— tiene{" "}
                <strong>{MARKET_DEFAULTS.sponsoredSlots} posiciones patrocinadas</strong>. El orden
                lo marca el importe que cada clínica tiene comprometido en ese mercado. Si dos
                comprometen lo mismo, va antes la que llegó primero a esa cifra: pujar tarde no
                adelanta a quien ya estaba.
              </p>
              <ul className="grid gap-4">
                {[
                  ["Importe mínimo para entrar", formatCentsCompact(MARKET_DEFAULTS.minimumBidCents)],
                  ["Salto mínimo entre pujas", formatCentsCompact(MARKET_DEFAULTS.bidIncrementCents)],
                  ["Recarga mínima de saldo", `${MIN_TOPUP_EUROS} €`],
                ].map(([label, value]) => (
                  <li
                    key={label}
                    className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5"
                  >
                    <span className="text-[14.5px] text-grey">{label}</span>
                    <span className="font-display text-[17px] font-semibold text-ink tabular-nums">
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[13.5px] text-grey">
                Son los valores de partida del sistema. Cada mercado puede tener los suyos según la
                competencia de la zona, y los ves en tu panel antes de comprometer nada.
              </p>
              <p className="text-[13.5px] text-grey">
                El modelo por defecto es este: saldo comprometido, sin coste por clic ni por
                solicitud. Un mercado puede configurarse para facturar por clic o por solicitud
                válida en lugar de por saldo; cuando así sea, lo verás indicado en ese mercado
                antes de pujar.
              </p>
            </div>

            <div className="rounded-brand border-t-[3px] border-t-cyan-brand border border-line bg-white p-6 shadow-card">
              <p className="kicker-muted">Ejemplo · lo que ves en tu panel</p>
              <h3 className="mt-3 font-display text-[17px] font-semibold uppercase tracking-[0.04em] text-ink">
                Pasar de la 3.ª a la 1.ª posición
              </h3>
              <dl className="mt-6 grid gap-3 text-[15px]">
                {[
                  ["Tienes comprometido", "450,00 €"],
                  ["Hace falta llegar a", "705,00 €"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4">
                    <dt className="text-grey">{k}</dt>
                    <dd className="tabular-nums text-ink">{v}</dd>
                  </div>
                ))}
                <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-3">
                  <dt className="font-medium text-ink">Pagas ahora</dt>
                  <dd className="font-display text-[24px] font-bold tabular-nums text-cyan-deep">
                    255,00 €
                  </dd>
                </div>
              </dl>
              <p className="mt-6 text-[13px] text-grey">
                Cifras de ejemplo. La diferencia se descuenta de tu saldo en ese momento y la
                posición se recalcula al instante. El importe comprometido solo se puede subir;
                para dejar de patrocinar, escríbenos y cerramos la puja.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Qué no se cobra */}
      <section className="section bg-mist" aria-labelledby="cobros">
        <div className="wrap grid gap-8 lg:grid-cols-2">
          <div>
            <p className="kicker">Qué no se te cobra</p>
            <h2 id="cobros" className="display-h2 mt-3 text-ink">
              El tráfico basura no lo pagas tú
            </h2>
            <ul className="mt-8 grid gap-4">
              {[
                "Aparecer. No se cobra por impresiones: en el modelo por defecto pagas el importe que comprometes y nada más.",
                `Clics repetidos del mismo visitante en menos de ${CLICK_DEDUPE_MINUTES} minutos, en los mercados que facturan por clic.`,
                `Solicitudes duplicadas —mismo teléfono, misma clínica, menos de ${LEAD_DEDUPE_HOURS} horas— en los mercados que facturan por solicitud.`,
                "Solicitudes revisadas como inválidas o spam, que se abonan de vuelta a tu saldo.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-anthracite">
                  <Check className="mt-1 size-4 shrink-0 text-positive" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="kicker">Lo que el dinero no compra</p>
            <h2 className="display-h2 mt-3 text-ink">Y no es negociable</h2>
            <ul className="mt-8 grid gap-4">
              {NO_COMPRA.map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-anthracite">
                  <X className="mt-1 size-4 shrink-0 text-negative" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-[52ch] text-[13.5px] text-grey">
              Si un paciente no puede fiarse del orden, el comparador no vale nada — ni para él ni
              para ti. Por eso la posición patrocinada va etiquetada siempre y en un bloque aparte.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Cobertura */}
      {cities.length > 0 && treatments.length > 0 ? (
        <section className="section" aria-labelledby="cobertura">
          <div className="wrap">
            <p className="kicker">Dónde puedes competir</p>
            <h2 id="cobertura" className="display-h2 mt-3 text-ink">
              {formatNumber(treatments.length)} tratamientos ·{" "}
              {formatNumber(cities.length)} municipios con clínicas
            </h2>
            <p className="mt-4 max-w-[62ch] text-[15.5px] text-grey">
              Cada cruce es un mercado independiente. En los municipios con poca competencia el
              coste de estar arriba es muy inferior al de una capital, y el paciente está igual de
              cerca.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {cities.slice(0, 14).map((c) => (
                <li key={c.slug}>
                  <Link
                    href={paths.city(c.slug)}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-[13.5px] text-ink transition-colors hover:border-cyan-brand hover:text-cyan-deep"
                  >
                    {c.name}
                    <span className="font-mono text-[11px] text-grey">{c._count.clinics}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------------ FAQ */}
      <div className="wrap">
        <FaqSection id="faq-clinicas" heading="Preguntas de las clínicas" items={FAQ_ITEMS} />
      </div>

      {/* ------------------------------------------------------------------ CTA */}
      <section className="bg-cyan-brand py-14 text-center sm:py-20">
        <div className="wrap">
          <h2 className="display-h2 text-white">Empieza por la ficha gratuita</h2>
          <p className="mx-auto mt-4 max-w-[54ch] text-[16.5px] text-white/90">
            Da de alta tu clínica, mide durante 30 días lo que te llega sin pagar nada y decide
            después si quieres pujar por un mercado.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="white" size="lg">
              <Link href="/alta-clinica">
                Dar de alta mi clínica <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="ghostWhite" size="lg">
              <Link href={paths.legal("condiciones")}>Leer las condiciones</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
