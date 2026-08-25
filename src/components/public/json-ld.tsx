/**
 * Inserta datos estructurados JSON-LD de forma segura.
 * Se escapa "<" para que un valor con literalmente "</script>" no pueda
 * cerrar la etiqueta e inyectar HTML.
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
