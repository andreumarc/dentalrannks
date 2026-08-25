import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { InfoNote } from "@/components/ui/states";
import { buildMetadata } from "@/lib/seo/metadata";
import { decideStaticIndexing } from "@/lib/seo/indexing";
import { paths } from "@/lib/seo/urls";
import { SITE_URL } from "@/lib/seo/config";

const LEGAL_PATH = paths.legal("condiciones");
const indexDecision = decideStaticIndexing(LEGAL_PATH);

export const metadata: Metadata = buildMetadata({
  title: "Condiciones del servicio para clínicas",
  description:
    "Condiciones que rigen la relación entre DentalRank y las clínicas dentales: publicación de la ficha, posiciones patrocinadas, saldo, solicitudes de pacientes y protección de datos.",
  path: LEGAL_PATH,
  index: indexDecision.index,
  follow: indexDecision.follow,
});

const breadcrumbItems = [
  { label: "Inicio", href: paths.home() },
  { label: "Legal", href: paths.legal("aviso-legal") },
  { label: "Condiciones del servicio" },
];

/** Índice lateral: el documento es largo y conviene poder saltar a un punto. */
const SECCIONES = [
  ["objeto", "1. Objeto"],
  ["alta", "2. Alta y verificación de la clínica"],
  ["ficha", "3. Contenido de la ficha"],
  ["posiciones", "4. Posiciones patrocinadas"],
  ["saldo", "5. Saldo, cobros y facturación"],
  ["leads", "6. Solicitudes de pacientes"],
  ["datos", "7. Protección de datos"],
  ["obligaciones", "8. Obligaciones de la clínica"],
  ["responsabilidad", "9. Responsabilidad de DentalRank"],
  ["suspension", "10. Suspensión y baja"],
  ["modificaciones", "11. Modificaciones"],
  ["ley", "12. Ley aplicable"],
] as const;

function Seccion({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line pt-7">
      <h2 className="display-h3 text-ink">{titulo}</h2>
      <div className="mt-3 space-y-3 text-[15.5px] leading-relaxed text-grey">{children}</div>
    </section>
  );
}

export default function CondicionesPage() {
  return (
    <div className="wrap section">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, SITE_URL)} />
      <Breadcrumbs items={breadcrumbItems} />

      <header className="mt-6 max-w-[70ch]">
        <p className="kicker">Legal · Clínicas</p>
        <h1 className="display-h1 mt-3 text-ink">Condiciones del servicio para clínicas</h1>
        <p className="mt-4 text-[16px] text-grey">
          Estas condiciones regulan el uso de DentalRank por parte de las clínicas dentales que se
          dan de alta en el marketplace. No se aplican a los pacientes, que se rigen por el{" "}
          <Link href="/legal/aviso-legal" className="text-cyan-deep underline">
            aviso legal
          </Link>{" "}
          y la{" "}
          <Link href="/legal/privacidad" className="text-cyan-deep underline">
            política de privacidad
          </Link>
          .
        </p>
        <p className="kicker-muted mt-4">Versión 2026-08-v1</p>
      </header>

      <div className="mt-8 max-w-[70ch]">
        <InfoNote tone="warning">
          <strong>Plantilla pendiente de revisión jurídica.</strong> Este texto recoge cómo funciona
          realmente el servicio, pero no sustituye el criterio de un abogado. Los datos registrales
          aparecen como marcadores <code>[…]</code> y deben completarse antes de operar con clínicas
          reales.
        </InfoNote>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_240px]">
        <div className="order-2 max-w-[70ch] space-y-7 lg:order-1">
          <Seccion id="objeto" titulo="1. Objeto">
            <p>
              DentalRank es un servicio de comparación de clínicas dentales y de captación de
              solicitudes de pacientes, titularidad de [razón social], con CIF [CIF] y domicilio en
              [dirección] (en adelante, «DentalRank»).
            </p>
            <p>
              DentalRank <strong>no presta servicios sanitarios</strong>, no interviene en la
              relación clínica entre el profesional y el paciente, no emite juicios clínicos ni
              recomienda tratamientos. Su función es poner en contacto a una persona interesada con
              la clínica que ella misma elige.
            </p>
          </Seccion>

          <Seccion id="alta" titulo="2. Alta y verificación de la clínica">
            <p>
              El alta la realiza una persona con capacidad para obligar a la clínica. La ficha se
              publica tras una revisión del equipo de DentalRank.
            </p>
            <p>
              El distintivo <strong>«Clínica verificada»</strong> solo se concede cuando la clínica
              aporta razón social, CIF, dirección y persona responsable, y esos datos se comprueban.
              DentalRank no muestra titulaciones, acreditaciones ni certificaciones sanitarias que
              no haya verificado.
            </p>
          </Seccion>

          <Seccion id="ficha" titulo="3. Contenido de la ficha">
            <p>
              La clínica es responsable de la exactitud de todo lo que publica: descripción,
              tratamientos, precios «desde», horarios, equipo, fotografías y datos de contacto. Debe
              disponer de los derechos sobre las imágenes que suba.
            </p>
            <p>
              La publicidad sanitaria está sujeta a normativa específica y a las normas
              deontológicas del colegio profesional correspondiente. Su cumplimiento corresponde a
              la clínica. DentalRank puede retirar contenido que resulte engañoso, que prometa
              resultados o que incumpla dicha normativa.
            </p>
          </Seccion>

          <Seccion id="posiciones" titulo="4. Posiciones patrocinadas">
            <p>
              Cada combinación de tratamiento y municipio constituye un mercado independiente. La
              clínica puede comprometer un importe para ocupar una posición patrocinada en ese
              mercado. El orden lo determina el importe comprometido y, en caso de empate, quién lo
              alcanzó antes.
            </p>
            <p>
              Las posiciones patrocinadas se identifican siempre como tales ante el paciente.{" "}
              <strong>
                El importe pagado no influye en el DentalRank Score ni en el orden de los resultados
                no patrocinados
              </strong>
              , y no constituye ninguna valoración de la calidad asistencial de la clínica.
            </p>
            <p>
              DentalRank no garantiza un número determinado de visitas, clics, solicitudes ni
              pacientes.
            </p>
          </Seccion>

          <Seccion id="saldo" titulo="5. Saldo, cobros y facturación">
            <p>
              La clínica recarga saldo mediante el proveedor de pagos Stripe. El saldo se consume
              según el modelo de cada mercado: importe comprometido por posición patrocinada, coste
              por clic válido o coste por solicitud válida.
            </p>
            <p>
              Cada movimiento queda reflejado en un libro mayor consultable desde el panel. El saldo
              únicamente se modifica desde los sistemas de DentalRank; ninguna acción del navegador
              lo altera.
            </p>
            <p>
              Los clics repetidos del mismo visitante dentro de una ventana antifraude no se
              facturan. Las solicitudes marcadas como duplicadas, inválidas o spam no se cobran y,
              si ya se hubieran cobrado, se abonan de nuevo al saldo.
            </p>
            <p>
              El saldo no consumido [no] es reembolsable en metálico salvo [condiciones a definir
              con asesoría jurídica y fiscal]. La facturación se emite [periodicidad] con los
              impuestos que legalmente correspondan.
            </p>
          </Seccion>

          <Seccion id="leads" titulo="6. Solicitudes de pacientes">
            <p>
              Una solicitud contiene los datos que la persona facilita voluntariamente: nombre,
              teléfono, email, código postal, tratamiento de interés, preferencia horaria y un
              comentario opcional. DentalRank <strong>no solicita datos de salud</strong> y pide a
              la clínica que tampoco los requiera a través de la plataforma.
            </p>
            <p>
              La solicitud se remite exclusivamente a la clínica que la persona ha seleccionado, y
              solo si ha otorgado su consentimiento expreso para ello.
            </p>
            <p>
              DentalRank no garantiza que la persona responda, acuda a la cita ni contrate ningún
              tratamiento.
            </p>
          </Seccion>

          <Seccion id="datos" titulo="7. Protección de datos">
            <p>
              Respecto de los datos de las personas que solicitan valoración, DentalRank y la
              clínica actúan como <strong>responsables independientes del tratamiento</strong>: cada
              uno determina sus propios fines y responde de sus propias obligaciones. No se trata de
              una relación de encargo de tratamiento.
            </p>
            <p>
              Al aceptar estas condiciones, la clínica asume, respecto de los datos que recibe:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>Tratarlos únicamente para atender la solicitud de la persona.</li>
              <li>
                Informarla en el primer contacto de quién es la clínica y con qué finalidad la
                contacta.
              </li>
              <li>
                No utilizarlos para comunicaciones comerciales ajenas a esa solicitud sin obtener su
                propio consentimiento.
              </li>
              <li>Atender los derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición.</li>
              <li>Aplicar medidas de seguridad adecuadas y conservar los datos el tiempo imprescindible.</li>
              <li>Comunicar a DentalRank cualquier brecha de seguridad que afecte a estos datos.</li>
            </ul>
            <p>
              DentalRank conserva registro de la versión del consentimiento, el momento y el origen
              de cada solicitud, y puede aportarlo si la clínica debe acreditar la licitud del
              tratamiento.
            </p>
          </Seccion>

          <Seccion id="obligaciones" titulo="8. Obligaciones de la clínica">
            <ul className="ml-5 list-disc space-y-1.5">
              <li>Estar legalmente habilitada para prestar los servicios que anuncia.</li>
              <li>Mantener actualizados sus datos, precios y disponibilidad.</li>
              <li>Atender las solicitudes en un plazo razonable.</li>
              <li>No falsear reseñas, valoraciones ni estados de las solicitudes.</li>
              <li>No generar clics ni solicitudes artificiales, propias o de terceros.</li>
              <li>Custodiar las credenciales de acceso de su equipo.</li>
            </ul>
          </Seccion>

          <Seccion id="responsabilidad" titulo="9. Responsabilidad de DentalRank">
            <p>
              DentalRank presta el servicio con diligencia razonable, pero no garantiza
              disponibilidad ininterrumpida ni resultados comerciales concretos.
            </p>
            <p>
              DentalRank no responde de la relación entre la clínica y el paciente, de la asistencia
              prestada, de los precios aplicados ni del contenido que la clínica publica.
            </p>
            <p>
              [Límite de responsabilidad a definir con asesoría jurídica, sin excluir el dolo ni la
              culpa grave ni los supuestos que la ley no permite limitar.]
            </p>
          </Seccion>

          <Seccion id="suspension" titulo="10. Suspensión y baja">
            <p>
              DentalRank puede suspender o retirar una ficha si detecta información falsa,
              incumplimiento normativo, actividad fraudulenta o impago, informando del motivo.
            </p>
            <p>
              La clínica puede darse de baja en cualquier momento desde su panel o escribiendo a
              [email]. La baja no afecta a las solicitudes ya recibidas ni a las obligaciones
              pendientes.
            </p>
          </Seccion>

          <Seccion id="modificaciones" titulo="11. Modificaciones">
            <p>
              DentalRank puede modificar estas condiciones. Los cambios relevantes se comunicarán
              con [plazo] de antelación. Cada versión queda identificada por su número, y en el
              momento del alta se registra cuál se aceptó.
            </p>
          </Seccion>

          <Seccion id="ley" titulo="12. Ley aplicable">
            <p>
              Estas condiciones se rigen por la legislación española. Para cualquier controversia,
              las partes se someten a los juzgados y tribunales de [localidad], salvo que la norma
              imponga otro fuero.
            </p>
          </Seccion>
        </div>

        <nav aria-label="Índice del documento" className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-28">
            <p className="kicker-muted mb-3">En esta página</p>
            <ul className="space-y-1.5 border-l border-line pl-4">
              {SECCIONES.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-[13.5px] text-grey hover:text-cyan-deep">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}
