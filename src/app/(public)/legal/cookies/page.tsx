import type { Metadata } from "next";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { InfoNote } from "@/components/ui/states";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { buildMetadata } from "@/lib/seo/metadata";
import { decideStaticIndexing } from "@/lib/seo/indexing";
import { paths } from "@/lib/seo/urls";
import { SITE_URL } from "@/lib/seo/config";

const LEGAL_PATH = paths.legal("cookies");
const indexDecision = decideStaticIndexing(LEGAL_PATH);

export const metadata: Metadata = buildMetadata({
  title: "Política de cookies",
  description: "Política de cookies de DentalRank: qué cookies usamos y cómo puedes gestionarlas.",
  path: LEGAL_PATH,
  index: indexDecision.index,
  follow: indexDecision.follow,
});

const breadcrumbItems = [
  { label: "Inicio", href: paths.home() },
  { label: "Legal", href: paths.legal("aviso-legal") },
  { label: "Cookies" },
];

const COOKIE_ROWS = [
  {
    name: "dentalrank-cookie-consent",
    type: "Técnica (necesaria)",
    purpose: "Recuerda tu elección sobre cookies para no volver a preguntarte.",
    duration: "Sin caducidad (hasta que la borres del navegador)",
  },
  {
    name: "[…nombre de la cookie de sesión…]",
    type: "Técnica (necesaria)",
    purpose: "[…gestión de sesión, si aplica…]",
    duration: "[…]",
  },
  {
    name: "[…cookies analíticas, si se activan…]",
    type: "Analítica (requiere consentimiento)",
    purpose: "[…medición de audiencia y uso del sitio…]",
    duration: "[…]",
  },
  {
    name: "[…cookies de marketing, si se activan…]",
    type: "Marketing (requiere consentimiento)",
    purpose: "[…publicidad y remarketing…]",
    duration: "[…]",
  },
];

export default function CookiesPage() {
  return (
    <div className="wrap section max-w-[860px]">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, SITE_URL)} />
      <Breadcrumbs items={breadcrumbItems} />

      <InfoNote tone="warning">
        <strong>Plantilla pendiente de revisión jurídica.</strong> El listado de cookies es
        orientativo. Antes de publicar, debe completarse con el inventario real de cookies en
        producción (nombre exacto, proveedor y duración) y revisarse por un profesional.
      </InfoNote>

      <h1 className="display-h1 mt-8 text-ink">Política de cookies</h1>

      <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-ink/90">
        <section>
          <h2 className="display-h3 mb-2 text-anthracite">¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos que un sitio web guarda en tu navegador para
            recordar información sobre tu visita, como tus preferencias o, en su caso, tu
            actividad de navegación.
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">Tipos de cookies que usamos</h2>
          <p>
            Distinguimos tres categorías. Las técnicas están siempre activas porque son
            imprescindibles para que el sitio funcione; las analíticas y de marketing solo se
            activan si das tu consentimiento en el aviso de cookies.
          </p>
        </section>

        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Cookie</Th>
                <Th>Tipo</Th>
                <Th>Finalidad</Th>
                <Th>Duración</Th>
              </Tr>
            </thead>
            <tbody>
              {COOKIE_ROWS.map((row) => (
                <Tr key={row.name}>
                  <Td className="font-mono text-[12.5px]">{row.name}</Td>
                  <Td>{row.type}</Td>
                  <Td>{row.purpose}</Td>
                  <Td>{row.duration}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">Cómo gestionar tus preferencias</h2>
          <p>
            Puedes cambiar tu elección en cualquier momento borrando los datos de este sitio
            desde la configuración de tu navegador, lo que hará que el aviso de cookies vuelva
            a aparecer. También puedes configurar tu navegador para bloquear cookies de forma
            general; ten en cuenta que esto puede afectar al funcionamiento del sitio.
          </p>
        </section>

        <section>
          <h2 className="display-h3 mb-2 text-anthracite">Cambios en esta política</h2>
          <p>
            Podemos actualizar esta política de cookies. Te recomendamos revisarla
            periódicamente.
          </p>
        </section>
      </div>
    </div>
  );
}
