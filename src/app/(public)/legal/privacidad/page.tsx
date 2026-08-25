import type { Metadata } from "next";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { InfoNote } from "@/components/ui/states";
import { CONSENT_VERSION } from "@/lib/consent";
import { buildMetadata } from "@/lib/seo/metadata";
import { decideStaticIndexing } from "@/lib/seo/indexing";
import { paths } from "@/lib/seo/urls";
import { SITE_URL } from "@/lib/seo/config";

const LEGAL_PATH = paths.legal("privacidad");
const indexDecision = decideStaticIndexing(LEGAL_PATH);

export const metadata: Metadata = buildMetadata({
  title: "Política de privacidad",
  description: "Política de privacidad de DentalRank.",
  path: LEGAL_PATH,
  index: indexDecision.index,
  follow: indexDecision.follow,
});

const breadcrumbItems = [
  { label: "Inicio", href: paths.home() },
  { label: "Legal", href: paths.legal("aviso-legal") },
  { label: "Privacidad" },
];

export default function PrivacyPage() {
  return (
    <div className="wrap section max-w-[820px]">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, SITE_URL)} />
      <Breadcrumbs items={breadcrumbItems} />

      <InfoNote tone="warning">
        <strong>Plantilla pendiente de revisión jurídica.</strong> Este texto es un borrador de
        trabajo, no un documento legal válido. Los campos marcados con «[…]» deben
        completarse y todo el contenido debe ser revisado por un profesional antes de
        publicarse en producción.
      </InfoNote>

      <h1 className="display-h1 mt-8 text-ink">Política de privacidad</h1>
      <p className="mt-2 text-[13px] text-grey-light">
        Última actualización: versión de consentimiento {CONSENT_VERSION}.
      </p>

      <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-ink/90">
        <section>
          <h2 className="display-h3 mb-2 text-anthracite">1. Responsable del tratamiento</h2>
          <p>
            […Razón social…], con NIF […], domicilio en […dirección completa…], correo de
            contacto de privacidad […privacidad@dominio…] (en adelante, «DentalRank»).
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">2. Datos que recogemos</h2>
          <p>Cuando solicitas una valoración a través de una ficha de clínica, recogemos:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Nombre y apellidos.</li>
            <li>Teléfono y correo electrónico.</li>
            <li>Código postal (opcional).</li>
            <li>Preferencia horaria y comentario, si los indicas.</li>
            <li>Registro técnico del consentimiento (versión, fecha, texto aceptado).</li>
          </ul>
          <p className="mt-2">
            No solicitamos ni almacenamos datos relativos a tu salud (categoría especial de
            datos, art. 9 RGPD). Si incluyes información de salud en el campo de comentario
            libre, se eliminará o se solicitará su eliminación en cuanto se detecte.
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">3. Finalidad y base legítima</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Gestión de la solicitud de valoración:</strong> enviamos tus datos a la
              clínica que elijas para que pueda contactarte. Base: ejecución de una relación
              precontractual a petición tuya (art. 6.1.b RGPD) y tu consentimiento expreso.
            </li>
            <li>
              <strong>Comunicaciones comerciales de DentalRank:</strong> solo si marcas la
              casilla opcional correspondiente. Base: consentimiento (art. 6.1.a RGPD).
            </li>
            <li>
              <strong>Prevención de fraude y abuso:</strong> limitación de peticiones y
              detección de duplicados. Base: interés legítimo (art. 6.1.f RGPD).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">4. Destinatarios</h2>
          <p>
            La clínica que selecciones recibe tus datos de contacto para gestionar tu
            solicitud. […Proveedores de infraestructura, hosting y base de datos…] pueden
            acceder a los datos como encargados del tratamiento, bajo contrato. No vendemos tus
            datos a terceros.
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">5. Conservación</h2>
          <p>
            Conservamos los datos de tu solicitud mientras sea necesario para gestionarla y,
            posteriormente, durante los plazos legales aplicables […plazo concreto, p. ej. de
            prescripción de responsabilidades…]. El registro del consentimiento se conserva
            como prueba mientras exista la relación o pueda derivarse responsabilidad.
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">6. Tus derechos</h2>
          <p>Puedes ejercer en cualquier momento, de forma gratuita:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Acceso:</strong> saber qué datos tuyos tratamos.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
            <li><strong>Supresión:</strong> solicitar que eliminemos tus datos.</li>
            <li><strong>Limitación:</strong> restringir el tratamiento en determinados supuestos.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
            <li><strong>Oposición:</strong> oponerte a un tratamiento concreto, incluido el marketing.</li>
          </ul>
          <p className="mt-2">
            Para ejercerlos, escribe a […privacidad@dominio…] indicando el derecho que quieres
            ejercer y adjuntando un documento que acredite tu identidad. También puedes
            reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">7. Menores de edad</h2>
          <p>DentalRank no está dirigido a menores de 18 años. No solicitamos datos de menores conscientemente.</p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">8. Cambios en esta política</h2>
          <p>
            Podemos actualizar esta política. Los cambios relevantes se indicarán en esta misma
            página con la fecha de última actualización.
          </p>
        </section>
      </div>
    </div>
  );
}
