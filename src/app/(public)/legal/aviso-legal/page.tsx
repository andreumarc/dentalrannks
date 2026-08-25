import type { Metadata } from "next";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { InfoNote } from "@/components/ui/states";
import { buildMetadata } from "@/lib/seo/metadata";
import { decideStaticIndexing } from "@/lib/seo/indexing";
import { paths } from "@/lib/seo/urls";
import { SITE_URL } from "@/lib/seo/config";

// Las 4 páginas legales (aviso-legal, condiciones, cookies, privacidad)
// comparten `paths.legal()` como único generador de ruta y `buildMetadata()`
// como único constructor de metadatos — igual que el resto del sitio —, en
// vez de fijar aquí un objeto `Metadata` a mano: así el canonical siempre es
// absoluto y autorreferencial, con hreflang y `googleBot` incluidos, y nunca
// diverge si `PRIVATE_PATH_PREFIXES` cambia.
const LEGAL_PATH = paths.legal("aviso-legal");
const indexDecision = decideStaticIndexing(LEGAL_PATH);

export const metadata: Metadata = buildMetadata({
  title: "Aviso legal",
  description: "Aviso legal y condiciones de uso de DentalRank.",
  path: LEGAL_PATH,
  index: indexDecision.index,
  follow: indexDecision.follow,
});

const breadcrumbItems = [
  { label: "Inicio", href: paths.home() },
  { label: "Legal", href: paths.legal("aviso-legal") },
  { label: "Aviso legal" },
];

export default function LegalNoticePage() {
  return (
    <div className="wrap section max-w-[820px]">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, SITE_URL)} />
      <Breadcrumbs items={breadcrumbItems} />

      <InfoNote tone="warning">
        <strong>Plantilla pendiente de revisión jurídica.</strong> Este texto es un borrador de
        trabajo, no un documento legal válido. Los campos marcados con «[…]» deben
        completarse con los datos registrales reales y revisarse por un profesional antes de
        publicarse en producción.
      </InfoNote>

      <h1 className="display-h1 mt-8 text-ink">Aviso legal</h1>

      <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-ink/90">
        <section>
          <h2 className="display-h3 mb-2 text-anthracite">1. Datos identificativos</h2>
          <p>
            En cumplimiento del deber de información del artículo 10 de la Ley 34/2002, de 11
            de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico
            (LSSI-CE), se informa de los siguientes datos:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Titular: […Razón social…]</li>
            <li>NIF/CIF: […]</li>
            <li>Domicilio social: […dirección completa…]</li>
            <li>Correo electrónico: […contacto@dominio…]</li>
            <li>Datos registrales: […Registro Mercantil, tomo, folio, hoja…]</li>
          </ul>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">2. Objeto</h2>
          <p>
            DentalRank es un comparador de clínicas dentales. Permite a los usuarios buscar
            clínicas por tratamiento y municipio y solicitar valoración. DentalRank no presta
            servicios sanitarios, no forma parte del personal de ninguna clínica y no
            interviene en la relación asistencial entre paciente y clínica.
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">3. Condiciones de uso</h2>
          <p>
            El acceso y uso del sitio atribuye la condición de usuario e implica la aceptación
            de las condiciones aquí recogidas. El usuario se compromete a hacer un uso lícito
            del sitio, a no introducir contenido falso o fraudulento en los formularios y a no
            intentar acceder a áreas restringidas del sistema.
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">4. Contenido aportado por las clínicas</h2>
          <p>
            La información de cada ficha (descripción, precios, fotografías, horarios,
            tratamientos) la aporta la propia clínica y es responsabilidad suya. DentalRank
            realiza comprobaciones razonables pero no garantiza la exactitud absoluta de la
            información publicada por terceros.
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">5. Propiedad intelectual e industrial</h2>
          <p>
            El diseño, el código, los textos propios, las marcas y logotipos de DentalRank son
            titularidad de […Razón social…] o de sus licenciantes. Queda prohibida su
            reproducción sin autorización expresa.
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">6. Limitación de responsabilidad</h2>
          <p>
            DentalRank no es responsable de la calidad asistencial de las clínicas listadas ni
            del resultado de los tratamientos contratados. El DentalRank Score es una señal de
            calidad de ficha y servicio, no un juicio clínico ni una certificación sanitaria.
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">7. Legislación aplicable y jurisdicción</h2>
          <p>
            Este aviso legal se rige por la legislación española. Para cualquier controversia
            se someterá a los juzgados y tribunales de […ciudad…], salvo que la normativa de
            consumidores establezca un fuero distinto.
          </p>
        </section>
      </div>
    </div>
  );
}
