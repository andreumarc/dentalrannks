/**
 * Catálogo de fotografía del proyecto.
 *
 * Son imágenes de banco, servidas desde `public/img`. Se usan como contenido de
 * demostración y como respaldo cuando una clínica todavía no ha subido las suyas:
 * nunca deben presentarse como fotos reales de una clínica concreta sin que la
 * propia clínica las haya aportado.
 *
 * Criterio de honestidad: hoy el modelo de datos (`ClinicImage`, `Clinic.coverUrl`)
 * no distingue si una URL de imagen fue subida por la propia clínica o asignada
 * automáticamente desde este catálogo (así lo hace `src/server/seed.ts`, que
 * reparte `CLINIC_PHOTOS` como portada y galería de demostración). Para no dar a
 * entender que una foto de banco es la instalación real de una clínica concreta,
 * `isCatalogPhoto` permite comprobar si una URL pertenece a este catálogo: cuando
 * pertenece, la interfaz debe usar el `alt` neutro del catálogo (una escena
 * genérica) y NO mostrar ningún pie de foto que sugiera que la aportó la clínica;
 * un pie de atribución del tipo «Imagen de ambiente aportada por la clínica» solo
 * tiene sentido para una URL que no esté en este catálogo, es decir, subida de
 * verdad por la clínica.
 */

export type ClinicPhoto = {
  key: string;
  src: string;
  alt: string;
  /** Tratamientos con los que encaja la escena, por slug. */
  treatments: string[];
};

export const CLINIC_PHOTOS: ClinicPhoto[] = [
  {
    key: "higiene-revision",
    src: "/img/higiene-revision.webp",
    alt: "Paciente en el sillón durante una revisión con la higienista",
    treatments: ["limpieza", "periodoncia"],
  },
  {
    key: "higiene-limpieza",
    src: "/img/higiene-limpieza.webp",
    alt: "Higienista preparando a una paciente para una limpieza dental",
    treatments: ["limpieza", "periodoncia", "blanqueamiento"],
  },
  {
    key: "implante-consulta",
    src: "/img/implante-consulta.webp",
    alt: "Odontólogo explicando un implante dental en una tableta",
    treatments: ["implantes", "all-on-4", "corona"],
  },
  {
    key: "escaner-intraoral",
    src: "/img/escaner-intraoral.webp",
    alt: "Toma de impresión digital con escáner intraoral",
    treatments: ["implantes", "invisalign", "corona", "carillas"],
  },
  {
    key: "planificacion-3d",
    src: "/img/planificacion-3d.webp",
    alt: "Odontólogo revisando una planificación de implante en un TAC 3D",
    treatments: ["implantes", "all-on-4", "all-on-6", "regeneracion-osea"],
  },
  {
    key: "preparacion-cirugia",
    src: "/img/preparacion-cirugia.webp",
    alt: "Equipo preparando a un paciente antes de una cirugía oral",
    treatments: ["implantes", "extraccion", "regeneracion-osea"],
  },
  {
    key: "cirugia-implante",
    src: "/img/cirugia-implante.webp",
    alt: "Cirujano colocando un implante con lupas de aumento",
    treatments: ["implantes", "all-on-4", "all-on-6", "carga-inmediata"],
  },
  {
    key: "protesis-corona",
    src: "/img/protesis-corona.webp",
    alt: "Odontólogo comprobando el color de una prótesis con el paciente",
    treatments: ["corona", "puente", "carillas", "protesis-removible"],
  },
  {
    key: "fotografia-clinica",
    src: "/img/fotografia-clinica.webp",
    alt: "Sesión de fotografía clínica previa a un diseño de sonrisa",
    treatments: ["diseno-sonrisa", "carillas"],
  },
  {
    key: "alineador-entrega",
    src: "/img/alineador-entrega.webp",
    alt: "Entrega de un alineador transparente a un paciente",
    treatments: ["invisalign", "ortodoncia-invisible"],
  },
  {
    key: "alineador-colocacion",
    src: "/img/alineador-colocacion.webp",
    alt: "Paciente colocándose un alineador frente al espejo",
    treatments: ["invisalign", "ortodoncia-invisible"],
  },
  {
    key: "alineador-plan",
    src: "/img/alineador-plan.webp",
    alt: "Ortodoncista mostrando la secuencia completa de alineadores",
    treatments: ["invisalign", "ortodoncia-invisible", "brackets"],
  },
  {
    key: "diseno-sonrisa",
    src: "/img/diseno-sonrisa.webp",
    alt: "Comparación de sonrisa antes y después en una tableta",
    treatments: ["diseno-sonrisa", "carillas", "blanqueamiento"],
  },
  {
    key: "ortodoncia-consulta",
    src: "/img/ortodoncia-consulta.webp",
    alt: "Primera visita de ortodoncia con modelo dental y alineadores",
    treatments: ["invisalign", "ortodoncia-invisible", "ortodoncia-infantil"],
  },
];

const BY_KEY = new Map(CLINIC_PHOTOS.map((p) => [p.key, p]));
const CATALOG_URLS = new Set(CLINIC_PHOTOS.map((p) => p.src));

export function photo(key: string): ClinicPhoto | undefined {
  return BY_KEY.get(key);
}

/**
 * Indica si una URL de imagen pertenece a este catálogo de banco (frente a
 * una foto real subida por la propia clínica). Ver comentario del módulo.
 */
export function isCatalogPhoto(url: string): boolean {
  return CATALOG_URLS.has(url);
}

/** Imagen de portada para páginas de tratamiento. Determinista por slug. */
export function photoForTreatment(slug: string): ClinicPhoto {
  const matches = CLINIC_PHOTOS.filter((p) => p.treatments.includes(slug));
  if (matches.length === 0) return CLINIC_PHOTOS[1];
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return matches[hash % matches.length];
}

/** Portada de la home. Es la escena que mejor resume el producto. */
export const HERO_PHOTO = CLINIC_PHOTOS.find((p) => p.key === "planificacion-3d")!;
