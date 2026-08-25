import { cn } from "@/lib/utils";

/**
 * Iconos de tratamiento.
 *
 * Dibujo propio, en la geometría recta de la marca: una silueta de diente
 * común y un rasgo distintivo por tratamiento. Se usan en las tarjetas de
 * tratamiento en lugar de fotografía, porque ahí la foto compite con el
 * nombre y no aporta información: el icono identifica la categoría de un
 * vistazo y no da a entender que sea la clínica de nadie.
 */

const CUERPOS: Record<string, string> = {
  "implante":
    "<path d=\"M21 11h22l-2.4 11H23.4z\" fill=\"var(--icon-fill)\"/><path d=\"M32 22v25\"/><path d=\"M25 27h14M25 33.5h14M26.5 40h11M28.5 46h7\"/>",
  "arcada4":
    "<path d=\"M8 18c0 18 10.7 30 24 30s24-12 24-30\"/><circle cx=\"15\" cy=\"30\" r=\"3.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"26\" cy=\"42\" r=\"3.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"38\" cy=\"42\" r=\"3.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"49\" cy=\"30\" r=\"3.6\" fill=\"currentColor\" stroke=\"none\"/>",
  "arcada6":
    "<path d=\"M8 18c0 18 10.7 30 24 30s24-12 24-30\"/><circle cx=\"13\" cy=\"27\" r=\"3.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"19\" cy=\"37\" r=\"3.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"27\" cy=\"43\" r=\"3.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"37\" cy=\"43\" r=\"3.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"45\" cy=\"37\" r=\"3.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"51\" cy=\"27\" r=\"3.2\" fill=\"currentColor\" stroke=\"none\"/>",
  "rayo":
    "<path d=\"M8 18c0 18 10.7 30 24 30s24-12 24-30\"/><path d=\"M35 16l-9 14h8l-4 12 11-15h-8z\" fill=\"currentColor\" stroke=\"none\"/>",
  "hueso":
    "<path d=\"M23 15h18l-3.2 23a5.6 5.6 0 0 1-5.6 5 5.6 5.6 0 0 1-5.6-5z\" fill=\"var(--icon-fill)\"/><circle cx=\"14\" cy=\"27\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"16\" cy=\"38\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"50\" cy=\"27\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"48\" cy=\"38\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"32\" cy=\"52\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/>",
  "alineador":
    "<path d=\"M11 19c0 17 9.4 28 21 28s21-11 21-28\" fill=\"var(--icon-fill)\"/><path d=\"M20 21c0 12 5.4 20 12 20s12-8 12-20\"/><path d=\"M15 26h5M49 26h-5M20 36h5M44 36h-5\"/>",
  "brackets":
    "<path d=\"M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z\" fill=\"var(--icon-fill)\"/><path d=\"M26 26h12v11H26z\"/><path d=\"M12 31.5h14M38 31.5h14\"/>",
  "nino":
    "<path d=\"M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z\" fill=\"var(--icon-fill)\"/><circle cx=\"26.5\" cy=\"24\" r=\"2.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"37.5\" cy=\"24\" r=\"2.8\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M25.5 31.5c3.4 5 9.6 5 13 0\"/>",
  "carilla":
    "<path d=\"M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z\" fill=\"var(--icon-fill)\"/><path d=\"M23 16c4.6-3 13.4-3 18 0l-2.2 20c-4.2 2.2-9.4 2.2-13.6 0z\" fill=\"var(--icon-fill)\"/>",
  "brillo":
    "<path d=\"M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z\" fill=\"var(--icon-fill)\"/><path d=\"M50 11l2.4 5.6 5.6 2.4-5.6 2.4L50 27l-2.4-5.6-5.6-2.4 5.6-2.4z\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M50 33l1.5 3.6 3.6 1.5-3.6 1.5-1.5 3.6-1.5-3.6-3.6-1.5 3.6-1.5z\" fill=\"currentColor\" stroke=\"none\"/>",
  "sonrisa":
    "<path d=\"M7 29h50c0 12.6-11.2 21-25 21S7 41.6 7 29z\" fill=\"var(--icon-fill)\"/><path d=\"M7 29c8-9.6 42-9.6 50 0\"/><path d=\"M19 29v9M32 29v11M45 29v9\"/>",
  "limpieza":
    "<path d=\"M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z\" fill=\"var(--icon-fill)\"/><circle cx=\"48\" cy=\"40\" r=\"6.5\"/><path d=\"M43.4 44.6L35 53\"/>",
  "empaste":
    "<path d=\"M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z\" fill=\"var(--icon-fill)\"/><path d=\"M25 18h13l-2.4 9h-8.2z\" fill=\"currentColor\" stroke=\"none\"/>",
  "endodoncia":
    "<path d=\"M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z\" fill=\"var(--icon-fill)\"/><path d=\"M27.5 24v17M36.5 24v17\"/>",
  "extraccion":
    "<path d=\"M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z\" fill=\"var(--icon-fill)\"/><path d=\"M48 21v16M43 32l5 5 5-5\"/>",
  "corona":
    "<path d=\"M17 30l4.5-13 6.5 8.5 4-13 4 13 6.5-8.5L47 30z\" fill=\"var(--icon-fill)\"/><path d=\"M21 30h22l-3 15a5 5 0 0 1-5 4h-6a5 5 0 0 1-5-4z\"/>",
  "puente":
    "<path d=\"M10 21h44\"/><path d=\"M13 24h11v14a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4z\" fill=\"var(--icon-fill)\"/><path d=\"M27 24h10v17a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4z\" fill=\"var(--icon-fill)\"/><path d=\"M40 24h11v14a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4z\" fill=\"var(--icon-fill)\"/>",
  "protesis":
    "<path d=\"M9 21c0 16 10.3 26 23 26s23-10 23-26z\" fill=\"var(--icon-fill)\"/><path d=\"M9 21h46\"/><path d=\"M15 21v9M23 21v12M32 21v13M41 21v12M49 21v9\"/>",
  "encia":
    "<path d=\"M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z\" fill=\"var(--icon-fill)\"/><path d=\"M13 38c7 4.6 31 4.6 38 0\"/><path d=\"M50 16l-7 12\"/>",
  "urgencia":
    "<path d=\"M32 10c4.4 0 6.4 1.8 9.4 1.8 3.2 0 5.5-.4 5.5 5.8 0 4.6-1.3 7.3-2.3 11l-2.5 12.9c-.6 2.9-4.4 2.9-5 0l-2.2-10.4c-.5-2.4-4.1-2.4-4.6 0l-2.2 10.4c-.6 2.9-4.4 2.9-5 0L20.6 28.6c-1-3.7-2.3-6.4-2.3-11 0-6.2 2.3-5.8 5.5-5.8 3 0 5-1.8 8.2-1.8z\" fill=\"var(--icon-fill)\"/><circle cx=\"48\" cy=\"44\" r=\"9\"/><path d=\"M48 39.5v9M43.5 44h9\"/>",
};

/** Tratamiento (slug) -> icono. */
const POR_TRATAMIENTO: Record<string, string> = {
  "implantes": "implante",
  "all-on-4": "arcada4",
  "all-on-6": "arcada6",
  "carga-inmediata": "rayo",
  "regeneracion-osea": "hueso",
  "invisalign": "alineador",
  "ortodoncia-invisible": "alineador",
  "brackets": "brackets",
  "ortodoncia-infantil": "nino",
  "carillas": "carilla",
  "blanqueamiento": "brillo",
  "diseno-sonrisa": "sonrisa",
  "limpieza": "limpieza",
  "empaste": "empaste",
  "endodoncia": "endodoncia",
  "extraccion": "extraccion",
  "corona": "corona",
  "puente": "puente",
  "protesis-removible": "protesis",
  "periodoncia": "encia",
  "odontopediatria": "nino",
  "urgencias": "urgencia",
};

/** Respaldo por categoría cuando aparece un tratamiento nuevo sin icono propio. */
const POR_CATEGORIA: Record<string, string> = {
  "Implantología": "implante",
  "Ortodoncia": "alineador",
  "Estética": "sonrisa",
  "General": "limpieza",
  "Prótesis": "corona",
};

export function iconKeyForTreatment(slug: string, category?: string): string {
  return POR_TRATAMIENTO[slug] ?? (category ? POR_CATEGORIA[category] : undefined) ?? "limpieza";
}

export function TreatmentIcon({
  slug,
  category,
  size = 34,
  className,
}: {
  slug: string;
  category?: string;
  size?: number;
  className?: string;
}) {
  const body = CUERPOS[iconKeyForTreatment(slug, category)];
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      // El cuerpo es una constante de este módulo, nunca entrada de usuario.
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

/** Contenedor cuadrado con el fondo de marca. */
export function TreatmentIconTile({
  slug,
  category,
  className,
  size = 34,
}: {
  slug: string;
  category?: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "grid size-14 place-items-center rounded-brand bg-cyan-tint text-cyan-deep [--icon-fill:rgba(1,173,208,.13)]",
        className,
      )}
    >
      <TreatmentIcon slug={slug} category={category} size={size} />
    </span>
  );
}
