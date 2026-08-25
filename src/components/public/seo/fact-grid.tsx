export type Fact = { label: string; value: string };

/**
 * Rejilla de datos de contexto ("Provincia", "Comunidad autónoma",
 * "Clínicas publicadas", "Códigos postales"...). Un hecho con `value`
 * vacío se omite en vez de mostrar una tarjeta en blanco — así cada
 * llamada puede pasar campos que a veces no tienen dato sin comprobarlo
 * antes.
 */
export function FactGrid({ id, heading, facts }: { id: string; heading: string; facts: Fact[] }) {
  const visible = facts.filter((fact) => fact.value.trim().length > 0);
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby={`${id}-heading`} className="border-t border-line py-10 sm:py-12">
      <h2 id={`${id}-heading`} className="display-h2 mb-5 text-ink">
        {heading}
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((fact) => (
          <div key={fact.label} className="rounded-brand border border-line bg-white px-4 py-3.5">
            <dt className="kicker-muted">{fact.label}</dt>
            <dd className="mt-1 font-display text-[16px] font-semibold text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
