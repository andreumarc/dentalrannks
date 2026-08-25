/**
 * Contenido editorial por tratamiento.
 *
 * Sirve para que cada página de tratamiento y cada combinación
 * tratamiento×municipio tenga texto propio y útil, no una plantilla con el
 * nombre cambiado. Se combina con datos reales (número de clínicas, rango de
 * precios, valoraciones) que se calculan en tiempo de petición.
 *
 * REGLAS DE REDACCIÓN — se aplican a todas las entradas:
 *  - Nada de consejo clínico. No se indica qué tratamiento necesita nadie, ni
 *    se sugiere que uno sea mejor que otro. La decisión es del paciente y su
 *    dentista.
 *  - Nada de cifras inventadas: ni tasas de éxito, ni duraciones garantizadas,
 *    ni precios. Los precios salen siempre de la base de datos.
 *  - Se habla de lo que la persona puede *preguntar* y *comparar*, que es lo
 *    que aporta un comparador.
 *  - Sin promesas de resultado ni lenguaje publicitario sanitario.
 */

export type TreatmentFaq = {
  question: string;
  answer: string;
};

export type TreatmentContent = {
  /** Debe coincidir con `Treatment.slug`. */
  slug: string;
  /** Una frase. Se usa en meta descripciones y como subtítulo. */
  summary: string;
  /** Dos o tres párrafos: en qué consiste y en qué se fija quien compara. */
  intro: string[];
  /** Qué hace variar el precio entre clínicas. Lista corta y concreta. */
  priceFactors: string[];
  /** Qué conviene preguntar antes de aceptar un presupuesto. */
  questionsToAsk: string[];
  /** Tres a cinco preguntas frecuentes. Alimentan el JSON-LD de FAQPage. */
  faqs: TreatmentFaq[];
  /** Cómo lo busca la gente. Se usa para enlazado interno y variantes de texto. */
  synonyms: string[];
};

export const TREATMENT_CONTENT: TreatmentContent[] = [
  {
    slug: "implantes",
    summary:
      "Sustitución de una pieza perdida por una raíz artificial y su corona, con presupuesto y plazos que varían mucho entre clínicas.",
    intro: [
      "Un implante dental es un tornillo, normalmente de titanio, que se coloca en el hueso maxilar para sostener una corona que sustituye a la pieza perdida. El tratamiento suele repartirse en varias visitas: estudio y pruebas de imagen, cirugía, un periodo de integración en el hueso y, por último, la colocación de la corona.",
      "Al comparar presupuestos, la diferencia rara vez está en el tornillo. Está en qué incluye el precio: si entra el estudio con TAC, si la corona va aparte, qué materiales se usan y si están cubiertas las revisiones posteriores. Dos presupuestos con el mismo importe pueden cubrir cosas distintas.",
    ],
    priceFactors: [
      "Si el precio incluye solo el implante o también el pilar y la corona",
      "Si hace falta injerto óseo o elevación de seno antes de la cirugía",
      "Marca y tipo de implante, y material de la corona",
      "Pruebas de imagen y planificación digital incluidas",
      "Revisiones y garantía posterior",
    ],
    questionsToAsk: [
      "¿El precio publicado incluye la corona o solo el implante?",
      "¿Qué pruebas de imagen entran en el presupuesto?",
      "¿Qué marca de implante utilizáis y qué garantía tiene?",
      "¿Cuántas visitas y cuánto tiempo suele llevar en mi caso?",
      "¿Qué ocurre si el implante no integra?",
    ],
    faqs: [
      {
        question: "¿Qué incluye normalmente el precio de un implante dental?",
        answer:
          "Depende de la clínica. Algunas publican el precio del implante solo y facturan aparte el pilar y la corona; otras dan un precio cerrado que lo incluye todo. Por eso conviene pedir el desglose por escrito antes de comparar dos presupuestos.",
      },
      {
        question: "¿Puedo pedir varios presupuestos?",
        answer:
          "Sí. Solicitar valoración en varias clínicas es gratuito y no compromete a nada. Es la forma más directa de ver qué incluye cada una y con qué plazos trabaja.",
      },
      {
        question: "¿Hay financiación para los implantes?",
        answer:
          "Muchas clínicas ofrecen financiación propia o a través de una entidad. En DentalRank puedes ver qué clínicas indican que disponen de ella, y conviene confirmar con la clínica las condiciones concretas.",
      },
      {
        question: "¿La primera visita es gratuita?",
        answer:
          "En algunas clínicas sí y así lo indican en su ficha. Cuando la clínica lo ha declarado, aparece señalado en los resultados de búsqueda.",
      },
    ],
    synonyms: ["implante dental", "implantes dentales", "poner un implante", "implantología"],
  },
  {
    slug: "invisalign",
    summary:
      "Ortodoncia con férulas transparentes removibles, planificada por ordenador y con un número de alineadores que depende de cada caso.",
    intro: [
      "Invisalign es una marca de ortodoncia invisible que corrige la posición de los dientes con una serie de férulas transparentes que se cambian cada cierto tiempo. El plan se diseña a partir de un escaneado de la boca, y el número de alineadores varía mucho según el punto de partida.",
      "Al comparar clínicas conviene mirar el tipo de plan contratado, cuántas revisiones incluye, si entran los refinamientos al final del tratamiento y si los retenedores posteriores van incluidos o se facturan aparte.",
    ],
    priceFactors: [
      "Tipo de plan y número de alineadores previstos",
      "Si incluye refinamientos al terminar",
      "Retenedores posteriores incluidos o no",
      "Número de revisiones cubiertas",
      "Escaneado y estudio inicial",
    ],
    questionsToAsk: [
      "¿Qué tipo de plan es y cuántos alineadores incluye?",
      "¿Entran los refinamientos si al final hace falta ajustar?",
      "¿Los retenedores están incluidos?",
      "¿Cada cuánto son las revisiones y están cubiertas?",
      "¿Qué pasa si pierdo o rompo un alineador?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre Invisalign y otras ortodoncias invisibles?",
        answer:
          "Invisalign es una marca concreta de alineadores transparentes; existen otras marcas con el mismo principio. La clínica puede explicarte con cuál trabaja y por qué. En DentalRank se listan por separado porque la gente busca ambas cosas.",
      },
      {
        question: "¿El precio suele ser cerrado?",
        answer:
          "Muchas clínicas dan un precio cerrado por plan, pero el alcance de ese plan cambia entre centros. Pide por escrito qué incluye y qué queda fuera antes de comparar.",
      },
      {
        question: "¿Puedo empezar con un presupuesto y cambiar de clínica después?",
        answer:
          "Un tratamiento de ortodoncia se planifica de principio a fin, así que cambiar a mitad complica las cosas. Por eso merece la pena comparar antes de empezar.",
      },
    ],
    synonyms: ["invisalign", "ortodoncia invisible", "férulas transparentes", "alineadores"],
  },
  {
    slug: "all-on-4",
    summary:
      "Rehabilitación de una arcada completa apoyada en cuatro implantes, con una prótesis provisional fija en las primeras fases del tratamiento.",
    intro: [
      "All-on-4 es una técnica de implantología que rehabilita una arcada completa (superior o inferior) apoyándola en cuatro implantes, dos de ellos colocados en ángulo para aprovechar mejor el hueso disponible. Sobre esos cuatro implantes se atornilla una prótesis fija, primero provisional y después una definitiva, que sustituye a toda la fila de dientes perdidos.",
      "Al comparar presupuestos, la diferencia grande suele estar en qué fases incluye el precio: si cubre solo la provisional, si incluye también la definitiva, con qué material está hecha y si entran las pruebas de imagen y la planificación digital previas a la cirugía.",
    ],
    priceFactors: [
      "Si el precio incluye la prótesis provisional y la definitiva o solo una de las dos",
      "Material de la prótesis definitiva (resina, cerámica, disco de circonio)",
      "Pruebas de imagen (TAC) y planificación digital incluidas",
      "Tipo de sedación o anestesia y si está incluida",
      "Si hace falta injerto óseo adicional pese a la técnica",
      "Número de revisiones y ajustes cubiertos tras la cirugía",
    ],
    questionsToAsk: [
      "¿El precio incluye la prótesis provisional y la definitiva o solo una?",
      "¿Qué material lleva la prótesis definitiva?",
      "¿Está incluido el TAC y la planificación digital previa?",
      "¿Qué tipo de sedación se usa y va incluida en el presupuesto?",
      "¿Cuántas revisiones cubre el precio tras la colocación?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre All-on-4 y un implante por cada diente perdido?",
        answer:
          "All-on-4 apoya una arcada completa en cuatro implantes en lugar de colocar un implante por cada pieza que falta. La clínica es quien valora, con las pruebas de imagen, en qué casos plantea cada técnica.",
      },
      {
        question: "¿La prótesis que se coloca el mismo día es la definitiva?",
        answer:
          "No necesariamente. En muchos tratamientos se coloca primero una prótesis provisional el mismo día o pocos días después de la cirugía, y la definitiva se fabrica más adelante, tras un periodo de cicatrización. Conviene preguntar qué fase cubre cada parte del presupuesto.",
      },
      {
        question: "¿Hace falta injerto óseo con All-on-4?",
        answer:
          "La técnica busca aprovechar el hueso existente inclinando dos de los cuatro implantes, lo que en algunos casos evita el injerto. Si hace falta o no depende del caso y lo determina la clínica con las pruebas de imagen.",
      },
      {
        question: "¿Puedo comparar presupuestos de distintas clínicas?",
        answer:
          "Sí, pedir varias valoraciones es gratuito y no compromete a nada. Al comparar, conviene revisar si el importe incluye la prótesis definitiva o solo la provisional, porque es una partida grande que cambia mucho el total.",
      },
    ],
    synonyms: ["all on 4", "all-on-4", "prótesis sobre 4 implantes", "dientes en un día", "arcada completa sobre implantes"],
  },
  {
    slug: "all-on-6",
    summary:
      "Rehabilitación de una arcada completa apoyada en seis implantes, repartiendo la carga entre más puntos de apoyo que en un All-on-4.",
    intro: [
      "All-on-6 rehabilita una arcada completa con el mismo principio que All-on-4 -una prótesis fija atornillada sobre implantes- pero distribuidos en seis puntos de apoyo en lugar de cuatro, a lo largo del maxilar o la mandíbula. Sobre esos implantes se coloca primero una prótesis provisional y, más adelante, la definitiva.",
      "Al comparar presupuestos entre clínicas, el número de implantes es uno de los factores que más pesa en el precio final, junto con el material de la prótesis definitiva y si el importe cubre también la fase provisional o solo la definitiva.",
    ],
    priceFactors: [
      "Número de implantes y marca utilizada",
      "Material de la prótesis definitiva",
      "Si el precio incluye la provisional y la definitiva o solo una",
      "Pruebas de imagen (TAC) y planificación digital",
      "Si hace falta injerto óseo adicional",
      "Revisiones y ajustes posteriores incluidos",
    ],
    questionsToAsk: [
      "¿El precio incluye la prótesis provisional y la definitiva?",
      "¿Qué diferencia de coste hay frente a un tratamiento con menos implantes?",
      "¿Qué material lleva la prótesis definitiva?",
      "¿Está incluida la planificación con TAC?",
      "¿Cuántas revisiones cubre el presupuesto?",
    ],
    faqs: [
      {
        question: "¿En qué se diferencia All-on-6 de All-on-4?",
        answer:
          "Ambas técnicas rehabilitan una arcada completa con una prótesis fija, pero All-on-6 reparte el apoyo entre seis implantes en lugar de cuatro. La clínica es quien valora, con las pruebas de imagen, qué número de implantes plantea en cada caso.",
      },
      {
        question: "¿Es más caro que All-on-4?",
        answer:
          "El número de implantes es uno de los factores que más influye en el precio final, pero el importe también depende de los materiales de la prótesis y de si incluye la fase provisional. Conviene pedir el desglose para comparar dos presupuestos de forma correcta.",
      },
      {
        question: "¿La prótesis se coloca en la misma cita que los implantes?",
        answer:
          "Depende del caso y del protocolo de cada clínica. En muchos tratamientos se coloca primero una prótesis provisional y la definitiva se fabrica después de un periodo de cicatrización.",
      },
      {
        question: "¿Puedo pedir varios presupuestos antes de decidir?",
        answer:
          "Sí, solicitar valoración en varias clínicas es gratuito y no compromete a nada. Permite ver qué incluye cada presupuesto y con qué materiales trabaja cada clínica.",
      },
    ],
    synonyms: ["all on 6", "all-on-6", "prótesis sobre 6 implantes", "arcada completa sobre implantes", "rehabilitación con seis implantes"],
  },
  {
    slug: "carga-inmediata",
    summary:
      "Colocación de una prótesis provisional sobre los implantes en un plazo corto tras la cirugía, en lugar de esperar antes de cargarlos.",
    intro: [
      "La carga inmediata es un protocolo por el que se fija una prótesis o corona provisional sobre el implante en un plazo corto tras la cirugía, en vez de esperar el periodo de espera habitual antes de colocar algo encima. Se aplica tanto a un solo diente como a arcadas completas, en tratamientos como All-on-4 o All-on-6.",
      "Al comparar presupuestos, conviene separar qué corresponde a la provisional y qué a la definitiva, porque son fases distintas del mismo tratamiento y no todas las clínicas las incluyen en el mismo precio inicial.",
    ],
    priceFactors: [
      "Si se aplica a un solo implante o a una arcada completa",
      "Si el precio incluye la prótesis provisional y la definitiva",
      "Pruebas de imagen y estudio previo del hueso",
      "Material de la prótesis provisional",
      "Número de revisiones tras la colocación",
    ],
    questionsToAsk: [
      "¿El presupuesto incluye tanto la provisional como la definitiva?",
      "¿Cuánto tiempo pasa entre la cirugía y la colocación de la provisional en mi caso?",
      "¿Qué pruebas se hacen antes para valorar si es viable?",
      "¿Qué pasa si la provisional se rompe o hay que ajustarla?",
      "¿Cuántas revisiones incluye el precio?",
    ],
    faqs: [
      {
        question: "¿Qué significa carga inmediata?",
        answer:
          "Es un protocolo por el que se coloca una prótesis o corona provisional sobre el implante en un plazo corto tras la cirugía, en lugar de esperar el periodo de cicatrización habitual antes de poner algo encima. La prótesis definitiva llega más adelante.",
      },
      {
        question: "¿Se puede aplicar a cualquier caso?",
        answer:
          "Depende del caso. La clínica valora con pruebas de imagen si el hueso y la posición de los implantes permiten cargarlos de forma inmediata. No todos los pacientes son candidatos a este protocolo.",
      },
      {
        question: "¿La prótesis provisional tiene el mismo aspecto que la definitiva?",
        answer:
          "Suele ser un material distinto, pensado para esa fase intermedia. La definitiva se fabrica después, con materiales y ajustes propios de la etapa final del tratamiento.",
      },
      {
        question: "¿El precio de la carga inmediata es distinto al de un implante con carga diferida?",
        answer:
          "El protocolo añade una fase adicional -la prótesis provisional- que puede cambiar el desglose del presupuesto respecto a un implante que espera al periodo de cicatrización antes de cargarse. Conviene pedir el detalle de qué incluye cada fase.",
      },
    ],
    synonyms: ["carga inmediata", "implantes de carga inmediata", "dientes fijos en un día", "prótesis provisional el mismo día"],
  },
  {
    slug: "regeneracion-osea",
    summary:
      "Técnicas para aumentar la cantidad o densidad de hueso disponible en el maxilar o la mandíbula antes de colocar un implante.",
    intro: [
      "La regeneración ósea agrupa distintas técnicas -injerto en bloque, elevación de seno, regeneración ósea guiada- para aumentar el volumen o la densidad de hueso en una zona donde no hay suficiente para sostener un implante. El material del injerto puede proceder del propio paciente, de un banco de hueso o ser un material sintético.",
      "Al comparar presupuestos conviene fijarse en la técnica concreta que se plantea, el origen del material, si se hace en la misma cirugía que el implante o en una fase previa, y cuánto tiempo de espera contempla el plan antes de continuar con el tratamiento.",
    ],
    priceFactors: [
      "Tipo de técnica (injerto en bloque, elevación de seno, regeneración ósea guiada)",
      "Origen del material del injerto (propio, de banco, sintético)",
      "Si se realiza en la misma cirugía que el implante o en una fase previa",
      "Pruebas de imagen y planificación incluidas",
      "Membranas u otros materiales asociados",
    ],
    questionsToAsk: [
      "¿Qué tipo de injerto o técnica se plantea?",
      "¿De dónde procede el material del injerto?",
      "¿Se hace en la misma cirugía que el implante o antes?",
      "¿Cuánto tiempo hay que esperar después para poder colocar el implante?",
      "¿Qué incluye el presupuesto además del injerto?",
    ],
    faqs: [
      {
        question: "¿Qué es la regeneración ósea?",
        answer:
          "Es un conjunto de técnicas para aumentar el hueso disponible en una zona de la boca donde no hay suficiente para sostener un implante. Incluye injertos y procedimientos de regeneración guiada, y el tipo concreto lo valora la clínica según el caso.",
      },
      {
        question: "¿De dónde sale el material del injerto?",
        answer:
          "Puede proceder del propio paciente, de un banco de hueso o ser un material sintético. El origen influye en el precio y es algo que se puede preguntar antes de aceptar el presupuesto.",
      },
      {
        question: "¿Se hace siempre antes del implante o pueden ir juntos?",
        answer:
          "Depende del caso. En algunas ocasiones se realiza en la misma intervención que la colocación del implante, y en otras hace falta esperar a que el injerto se integre antes de continuar.",
      },
      {
        question: "¿Cuánto tiempo suele pasar hasta poder colocar el implante?",
        answer:
          "El tiempo de espera varía según la técnica y el caso, y lo estima la clínica tras valorar las pruebas de imagen. No hay un plazo único válido para todos los pacientes.",
      },
    ],
    synonyms: ["injerto óseo", "elevación de seno", "regeneración ósea guiada", "aumento de hueso", "injerto de hueso dental"],
  },
  {
    slug: "ortodoncia-invisible",
    summary:
      "Corrección de la posición de los dientes con férulas transparentes y removibles de distintas marcas, planificadas mediante escaneado digital.",
    intro: [
      "La ortodoncia invisible corrige la posición de los dientes con una serie de férulas o alineadores transparentes y removibles que se van cambiando a lo largo del tratamiento, fabricados a medida a partir de un escaneado 3D de la boca. Existen varias marcas de alineadores en el mercado, además de Invisalign.",
      "Al comparar clínicas conviene mirar con qué marca trabajan, cuántos alineadores incluye el plan, si entran los refinamientos finales y si los retenedores posteriores van incluidos o se facturan aparte.",
    ],
    priceFactors: [
      "Marca de alineador utilizada",
      "Número de alineadores previsto",
      "Si incluye refinamientos al terminar",
      "Retenedores incluidos o no",
      "Escaneado 3D y estudio inicial",
      "Número de revisiones cubiertas",
    ],
    questionsToAsk: [
      "¿Con qué marca de alineadores trabajáis?",
      "¿Cuántos alineadores incluye el plan?",
      "¿Qué pasa si al final hace falta ajustar el tratamiento?",
      "¿Los retenedores están incluidos?",
      "¿Cada cuánto son las revisiones?",
    ],
    faqs: [
      {
        question: "¿Es lo mismo que Invisalign?",
        answer:
          "Invisalign es una marca concreta de alineadores transparentes, pero existen otras marcas que ofrecen el mismo tipo de tratamiento. La clínica indica con cuál trabaja.",
      },
      {
        question: "¿Cómo se planifica el tratamiento?",
        answer:
          "Se parte de un escaneado 3D de la boca con el que se diseña la secuencia de alineadores que el paciente irá cambiando a lo largo del tratamiento. El número de alineadores depende de cada caso.",
      },
      {
        question: "¿Los alineadores se pueden quitar?",
        answer:
          "Son removibles, lo que distingue esta ortodoncia de los brackets fijos. Cada clínica indica sus propias pautas de uso, que conviene seguir según lo acordado con el profesional.",
      },
      {
        question: "¿El precio incluye los retenedores posteriores?",
        answer:
          "Depende del plan contratado. Algunas clínicas los incluyen en el precio y otras los facturan aparte, así que conviene preguntarlo antes de comparar presupuestos.",
      },
    ],
    synonyms: ["ortodoncia invisible", "alineadores transparentes", "férulas invisibles", "ortodoncia sin brackets", "ortodoncia con alineadores"],
  },
  {
    slug: "brackets",
    summary:
      "Ortodoncia fija con piezas ancladas a los dientes y un arco que las conecta, ajustado en revisiones sucesivas.",
    intro: [
      "Los brackets son un sistema de ortodoncia fijo: piezas pegadas a cada diente conectadas por un arco metálico que el ortodoncista va ajustando en visitas sucesivas para mover las piezas. Existen brackets metálicos, estéticos -de cerámica o zafiro- y linguales, colocados por la cara interna de los dientes para que no se vean desde fuera.",
      "Al comparar presupuestos conviene fijarse en el tipo de bracket incluido, cuántas revisiones cubre el precio y si los retenedores posteriores al tratamiento están incluidos o se cobran aparte.",
    ],
    priceFactors: [
      "Tipo de bracket (metálico, estético, lingual)",
      "Número de revisiones incluidas en el precio",
      "Retenedores posteriores incluidos o no",
      "Estudio y pruebas iniciales",
      "Gestión de incidencias durante el tratamiento (bracket despegado, arco que molesta)",
    ],
    questionsToAsk: [
      "¿Qué tipo de bracket está incluido en el precio?",
      "¿Cuántas revisiones cubre el presupuesto?",
      "¿Qué pasa si se despega un bracket entre visitas?",
      "¿Los retenedores van incluidos?",
      "¿El estudio inicial se cobra aparte?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre brackets metálicos y estéticos?",
        answer:
          "Los metálicos son de acero y los más visibles; los estéticos, de cerámica o zafiro, se mezclan más con el color del diente. El precio y la disponibilidad varían según la clínica.",
      },
      {
        question: "¿Qué son los brackets linguales?",
        answer:
          "Son brackets que se colocan por la cara interna de los dientes, de forma que no se ven desde fuera. Suelen tener un precio distinto al de los brackets convencionales.",
      },
      {
        question: "¿Cuántas revisiones hacen falta?",
        answer:
          "El número de visitas de ajuste depende de cada caso y lo determina el ortodoncista a lo largo del tratamiento. Conviene preguntar cuántas están incluidas en el presupuesto inicial.",
      },
      {
        question: "¿Qué pasa si un bracket se despega?",
        answer:
          "Es algo que puede ocurrir durante el tratamiento. Algunas clínicas incluyen estas incidencias en el precio cerrado y otras las cobran como visita aparte, conviene preguntarlo antes de empezar.",
      },
    ],
    synonyms: ["brackets", "ortodoncia con brackets", "brackets metálicos", "brackets estéticos", "aparato dental"],
  },
  {
    slug: "ortodoncia-infantil",
    summary:
      "Ortodoncia dirigida a niños y adolescentes, en edades en las que aún hay dientes de leche o el maxilar está en desarrollo.",
    intro: [
      "Cuando un hijo o hija todavía tiene dientes de leche o está en pleno crecimiento, la ortodoncia puede plantearse en fases distintas a la de un adulto: una primera fase para guiar el desarrollo del maxilar y, más adelante, una segunda fase con brackets o alineadores cuando ya han salido los dientes definitivos. No todos los niños pasan por las mismas fases ni con el mismo dispositivo; es la clínica quien lo valora caso a caso.",
      "Al comparar presupuestos conviene preguntar si cubren una fase o varias, qué tipo de aparato se plantea para esa edad y con qué frecuencia se hacen las revisiones mientras el niño o la niña sigue creciendo.",
    ],
    priceFactors: [
      "Número de fases previstas en el tratamiento",
      "Tipo de aparato (removible o fijo)",
      "Frecuencia de revisiones mientras el niño o la niña crece",
      "Estudio y pruebas de imagen iniciales",
      "Gestión de incidencias (aparato roto o que molesta)",
    ],
    questionsToAsk: [
      "¿El presupuesto cubre una fase o varias?",
      "¿Qué tipo de aparato se plantea para esta edad?",
      "¿Cada cuánto son las revisiones de seguimiento?",
      "¿Qué ocurre si el aparato se rompe o hay que ajustarlo entre visitas?",
      "¿Está incluido el estudio inicial con radiografías?",
    ],
    faqs: [
      {
        question: "¿A qué edad se suele valorar la ortodoncia infantil?",
        answer:
          "No hay una edad única: depende del desarrollo de cada niño o niña y de si aún tiene dientes de leche. Es el odontopediatra u ortodoncista quien valora en cada revisión si conviene hacer seguimiento o iniciar algún tratamiento.",
      },
      {
        question: "¿Es lo mismo que la ortodoncia de un adulto?",
        answer:
          "No necesariamente. En niños, el tratamiento puede plantearse en más de una fase porque el maxilar todavía está en desarrollo, mientras que en un adulto el hueso ya no crece. La clínica explica qué fases contempla en cada caso.",
      },
      {
        question: "¿El presupuesto incluye todas las fases del tratamiento?",
        answer:
          "Depende de la clínica. Algunos presupuestos cubren solo la fase en curso y otros dan una estimación de fases futuras, así que conviene preguntarlo antes de comparar precios.",
      },
      {
        question: "¿Qué pasa si mi hijo o hija pierde o rompe el aparato?",
        answer:
          "Es algo que puede pasar, sobre todo con aparatos removibles. Algunas clínicas incluyen la reposición en el precio y otras la cobran aparte; conviene preguntarlo al pedir presupuesto.",
      },
    ],
    synonyms: ["ortodoncia infantil", "ortodoncia para niños", "primera visita al ortodoncista niños", "ortopedia maxilar infantil", "aparato dental para niños"],
  },
  {
    slug: "carillas",
    summary:
      "Láminas finas que se adhieren a la cara visible del diente para cambiar su forma, color o alineación aparente.",
    intro: [
      "Una carilla es una lámina fina, normalmente de porcelana o composite, que se adhiere a la parte delantera del diente para modificar su forma, tamaño o color visible. Se colocan en uno o varios dientes según lo que se quiera cambiar, y en muchos casos requiere tallar una pequeña cantidad de esmalte antes de cementarlas.",
      "Al comparar presupuestos conviene fijarse en el material -composite o porcelana-, en si el precio es por diente o hay un paquete cerrado por boca completa, y en si el diseño previo del resultado está incluido.",
    ],
    priceFactors: [
      "Material (composite o porcelana)",
      "Número de dientes a tratar",
      "Si incluye diseño digital de sonrisa o prueba estética previa",
      "Si hace falta tallar esmalte o es una técnica sin tallado",
      "Tipo de laboratorio o técnico que fabrica las carillas",
    ],
    questionsToAsk: [
      "¿El precio es por diente o hay un paquete cerrado por boca completa?",
      "¿Qué material se usa?",
      "¿Hace falta tallar el diente o es una técnica sin tallado?",
      "¿Se hace una prueba o diseño previo antes de cementarlas?",
      "¿Qué garantía tienen las carillas?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre carillas de composite y de porcelana?",
        answer:
          "El composite se aplica y se moldea directamente sobre el diente en la misma consulta; la porcelana se fabrica en un laboratorio a partir de un molde y se cementa en una visita posterior. El precio y el número de visitas cambian según cuál se use.",
      },
      {
        question: "¿Hace falta tallar el diente?",
        answer:
          "Depende de la técnica y del caso. Algunas carillas requieren retirar una capa fina de esmalte y otras se presentan como técnicas sin tallado o con tallado mínimo. Conviene preguntarlo antes de decidir.",
      },
      {
        question: "¿El precio es por diente o por boca completa?",
        answer:
          "Varía según la clínica. Algunas cotizan por unidad y otras ofrecen un paquete cerrado para un número determinado de dientes, así que conviene pedir el precio unitario y el del conjunto.",
      },
      {
        question: "¿Se puede ver un diseño previo antes de hacerlas?",
        answer:
          "Muchas clínicas ofrecen algún tipo de prueba o simulación antes de fabricar las carillas definitivas. Si está incluido en el presupuesto o se cobra aparte es algo que se puede preguntar.",
      },
    ],
    synonyms: ["carillas dentales", "carillas de porcelana", "carillas de composite", "carillas estéticas", "fundas para dientes"],
  },
  {
    slug: "blanqueamiento",
    summary:
      "Aclarado del color de los dientes con un producto blanqueador, aplicado en clínica, con férulas para casa, o combinando ambas modalidades.",
    intro: [
      "El blanqueamiento aclara el tono natural del diente con un producto a base de peróxido. Puede aplicarse en la clínica con luz o láser, en casa con férulas personalizadas que el paciente usa durante un periodo determinado, o combinando ambas modalidades en el mismo tratamiento.",
      "Al comparar presupuestos conviene fijarse en qué modalidad incluye el precio, cuántas sesiones cubre, si las férulas a medida están incluidas y si hay algún retoque contemplado más adelante.",
    ],
    priceFactors: [
      "Modalidad (en clínica, en casa con férulas, o combinado)",
      "Número de sesiones incluidas",
      "Si el precio incluye las férulas a medida o el producto para casa",
      "Si hay retoque incluido pasado un tiempo",
      "Estudio previo del estado de los dientes",
    ],
    questionsToAsk: [
      "¿Qué modalidad de blanqueamiento incluye el precio?",
      "¿Cuántas sesiones cubre?",
      "¿Las férulas para casa están incluidas?",
      "¿Hay retoque incluido más adelante?",
      "¿El presupuesto contempla una revisión previa del estado de los dientes?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre el blanqueamiento en clínica y el de casa con férulas?",
        answer:
          "El de clínica se aplica en una o varias sesiones con un producto de mayor concentración bajo supervisión del dentista; el de casa se hace con férulas a medida y un producto de menor concentración durante un periodo más largo. Algunas clínicas combinan ambas modalidades en el mismo tratamiento.",
      },
      {
        question: "¿El resultado es el mismo para todos los dientes?",
        answer:
          "El color de partida y la causa de la tinción varían de una persona a otra, y eso influye en el resultado. La clínica puede explicar qué esperar en cada caso concreto.",
      },
      {
        question: "¿Hace falta una revisión antes de blanquear?",
        answer:
          "Muchas clínicas revisan el estado de los dientes y las encías antes de empezar, para descartar problemas que convenga tratar primero. Si esa revisión está incluida en el precio es algo que se puede preguntar.",
      },
      {
        question: "¿El blanqueamiento es permanente?",
        answer:
          "No hay una duración fija: depende de hábitos como el tabaco, el café o el té, y de cada persona. La clínica puede orientar sobre el mantenimiento, sin que eso implique un resultado garantizado.",
      },
    ],
    synonyms: ["blanqueamiento dental", "blanquear los dientes", "blanqueamiento con férulas", "blanqueamiento láser", "aclarar dientes"],
  },
  {
    slug: "diseno-sonrisa",
    summary:
      "Planificación estética conjunta de varios tratamientos -carillas, ortodoncia, blanqueamiento u otros- para cambiar el aspecto de la sonrisa de forma coordinada.",
    intro: [
      "El diseño de sonrisa no es un tratamiento único, sino un proceso de planificación que combina distintas técnicas -carillas, blanqueamiento, ortodoncia, cirugía de encías u otras- para modificar de forma conjunta el aspecto de la sonrisa. Suele partir de fotografías, escaneado digital y, en muchos casos, una simulación del resultado antes de empezar.",
      "Al comparar presupuestos conviene pedir el desglose por tratamiento, porque el plan puede incluir procedimientos muy distintos según la clínica, y no todas cubren un diseño digital previo en el mismo precio.",
    ],
    priceFactors: [
      "Qué tratamientos concretos incluye el plan (carillas, ortodoncia, blanqueamiento, encías...)",
      "Si el diseño o simulación digital previa está incluida",
      "Número de fases y visitas",
      "Materiales usados en cada tratamiento incluido",
      "Si hay pruebas o mockup físico antes del resultado final",
    ],
    questionsToAsk: [
      "¿Qué tratamientos concretos incluye el plan de diseño de sonrisa?",
      "¿El diseño digital o la simulación previa está incluida en el precio?",
      "¿En cuántas fases se divide el tratamiento?",
      "¿Qué parte del presupuesto corresponde a cada tratamiento?",
      "¿Se puede ver una prueba física antes del resultado definitivo?",
    ],
    faqs: [
      {
        question: "¿El diseño de sonrisa es un tratamiento en sí mismo?",
        answer:
          "No es un procedimiento único, sino la combinación planificada de varios tratamientos -como carillas, ortodoncia o blanqueamiento- para cambiar el aspecto conjunto de la sonrisa. Cada clínica define qué incluye su plan.",
      },
      {
        question: "¿Qué es la simulación o mockup?",
        answer:
          "Es una representación previa, digital o física, de cómo podría quedar el resultado antes de empezar el tratamiento. No todas las clínicas la incluyen en el precio del plan.",
      },
      {
        question: "¿Cuánto tarda un plan de diseño de sonrisa?",
        answer:
          "El tiempo depende de qué tratamientos incluya: un blanqueamiento y unas carillas llevan menos fases que un plan que incorpore ortodoncia. La clínica es quien puede detallar el calendario para un caso concreto.",
      },
      {
        question: "¿Cómo se compara el precio entre clínicas?",
        answer:
          "Conviene pedir el desglose por tratamiento, no solo el total del plan, porque dos presupuestos con el mismo nombre pueden incluir procedimientos distintos.",
      },
    ],
    synonyms: ["diseño de sonrisa", "smile design", "diseño digital de sonrisa", "rehabilitación estética de la sonrisa"],
  },
  {
    slug: "limpieza",
    summary:
      "Eliminación de placa y sarro de la superficie dental y del borde de la encía, con o sin pulido posterior.",
    intro: [
      "La limpieza dental retira con instrumental -manual o de ultrasonidos- la placa bacteriana y el sarro acumulados sobre el diente y en el borde de la encía, y suele terminar con un pulido de la superficie. Es distinta de un tratamiento periodontal en profundidad, que se plantea cuando hay pérdida de hueso o encía.",
      "Al comparar precios conviene fijarse en si incluye pulido además de la limpieza, si entra una revisión con el dentista en la misma cita y qué técnica se usa.",
    ],
    priceFactors: [
      "Si el precio incluye solo la limpieza o también pulido y fluorización",
      "Si incluye una revisión con el dentista además de la higienista",
      "Técnica usada (ultrasonidos, manual, o combinada)",
      "Si hay algún estudio o radiografía previa incluida",
    ],
    questionsToAsk: [
      "¿El precio incluye pulido además de la limpieza?",
      "¿Incluye una revisión con el dentista?",
      "¿Qué técnica se usa?",
      "¿Hace falta alguna prueba previa?",
      "¿Cada cuánto se recomienda repetirla según mi caso?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre una limpieza dental y un tratamiento de periodoncia?",
        answer:
          "La limpieza retira placa y sarro de la superficie visible del diente y el borde de la encía. La periodoncia se plantea cuando hay pérdida de hueso o encía y requiere un abordaje distinto, que valora el especialista.",
      },
      {
        question: "¿La limpieza incluye una revisión general?",
        answer:
          "Depende de la clínica. Algunas incluyen una revisión con el dentista en la misma cita y otras la facturan como consulta aparte, así que conviene preguntarlo.",
      },
      {
        question: "¿Con qué frecuencia se recomienda una limpieza?",
        answer:
          "No hay una frecuencia única válida para todo el mundo; depende de cada boca. Es el dentista o higienista quien puede orientar según cada caso durante una revisión.",
      },
      {
        question: "¿Duele hacerse una limpieza?",
        answer:
          "La sensación varía de una persona a otra según la sensibilidad de sus dientes y encías. La clínica puede explicar qué opciones existen si hay molestias durante el procedimiento.",
      },
    ],
    synonyms: ["limpieza dental", "limpieza bucal", "profilaxis dental", "quitar el sarro", "higiene dental"],
  },
  {
    slug: "empaste",
    summary:
      "Reconstrucción de un diente dañado por caries u otra pérdida de estructura, rellenando la parte afectada con un material dental.",
    intro: [
      "Un empaste elimina el tejido dañado -por ejemplo, por una caries- y rellena el hueco con un material, habitualmente composite del color del diente, aunque también existen empastes de otros materiales, para devolver la forma y la función a la pieza.",
      "Al comparar precios conviene tener en cuenta que el tamaño de la caries y el número de caras del diente afectadas suelen influir en el importe, y no todas las clínicas cotizan un empaste con un precio único.",
    ],
    priceFactors: [
      "Material del empaste (composite, otros materiales)",
      "Tamaño de la caries o número de caras del diente afectadas",
      "Número de empastes en la misma cita",
      "Si incluye radiografía diagnóstica y anestesia local",
      "Complejidad de la cavidad",
    ],
    questionsToAsk: [
      "¿Qué material se usa para el empaste?",
      "¿El precio depende del tamaño de la caries o es fijo?",
      "¿Está incluida la radiografía previa?",
      "¿La anestesia va incluida en el precio?",
      "¿Hay un precio distinto si son varios empastes en la misma cita?",
    ],
    faqs: [
      {
        question: "¿De qué material suelen ser los empastes hoy en día?",
        answer:
          "El más habitual en dientes visibles es el composite, del color del diente. Existen otros materiales según la ubicación y el caso, y es la clínica quien indica cuál plantea para cada diente.",
      },
      {
        question: "¿El precio depende del tamaño de la caries?",
        answer:
          "Sí, en muchas clínicas el precio varía según el tamaño de la cavidad o el número de caras del diente afectadas; no es un precio único para cualquier empaste.",
      },
      {
        question: "¿Un empaste dura para siempre?",
        answer:
          "No hay una duración garantizada: depende de materiales, hábitos y del cuidado posterior. La clínica puede explicar qué revisiones conviene hacer con el tiempo.",
      },
      {
        question: "¿Se puede hacer más de un empaste en la misma cita?",
        answer:
          "En muchos casos sí, si los dientes afectados lo permiten. Algunas clínicas aplican un precio distinto cuando se hacen varios empastes en la misma visita, conviene preguntarlo al pedir presupuesto.",
      },
    ],
    synonyms: ["empaste dental", "empastar una caries", "obturación dental", "empaste de composite", "tapar una caries"],
  },
  {
    slug: "endodoncia",
    summary:
      "Tratamiento del interior del diente cuando está dañado o infectado, para conservar la pieza en lugar de extraerla.",
    intro: [
      "La endodoncia limpia, desinfecta y sella el conducto interior del diente -donde está el nervio y la pulpa- cuando ese tejido está dañado o infectado. El objetivo es conservar el diente en su sitio en lugar de extraerlo. Después de una endodoncia, el diente suele necesitar una reconstrucción, que puede ser un empaste grande o una corona según el caso.",
      "Al comparar presupuestos conviene fijarse en el tipo de diente -un molar tiene más conductos que un incisivo- y en si el precio incluye la reconstrucción posterior o solo el tratamiento de conducto.",
    ],
    priceFactors: [
      "Tipo de diente (incisivo, premolar o molar, por el número de conductos)",
      "Si el precio incluye la reconstrucción posterior o solo el tratamiento de conducto",
      "Número de visitas necesarias",
      "Uso de microscopio o localizador de ápices",
      "Si es una endodoncia por primera vez o un retratamiento",
    ],
    questionsToAsk: [
      "¿El precio incluye la reconstrucción final del diente o solo el tratamiento de conducto?",
      "¿Cuántas visitas suele llevar en este tipo de diente?",
      "¿Usáis microscopio?",
      "¿Qué diferencia de precio hay entre un diente anterior y un molar?",
      "¿Qué pasa si hace falta un retratamiento más adelante?",
    ],
    faqs: [
      {
        question: "¿Por qué el precio de una endodoncia cambia según el diente?",
        answer:
          "Los molares tienen más conductos que los incisivos, lo que hace el tratamiento más largo y complejo. Por eso muchas clínicas cobran de forma distinta según el tipo de diente.",
      },
      {
        question: "¿La endodoncia incluye la reconstrucción del diente?",
        answer:
          "No siempre. Algunas clínicas cotizan solo el tratamiento de conducto y facturan aparte el empaste o la corona posterior, así que conviene preguntarlo antes de comparar precios.",
      },
      {
        question: "¿Qué es un retratamiento de endodoncia?",
        answer:
          "Es repetir el tratamiento de conducto en un diente que ya tuvo una endodoncia previa, cuando esta no resolvió el problema. Suele tener un precio distinto al de una endodoncia por primera vez.",
      },
      {
        question: "¿Después de una endodoncia hay que poner una corona siempre?",
        answer:
          "Depende del diente y de cuánta estructura le queda. Es la clínica quien valora si basta con una reconstrucción con composite o conviene una corona.",
      },
    ],
    synonyms: ["endodoncia", "matar el nervio", "tratamiento de conducto", "desvitalizar un diente", "sacar el nervio de la muela"],
  },
  {
    slug: "extraccion",
    summary:
      "Retirada de una pieza dental que no puede o no conviene conservarse, desde una extracción simple hasta una quirúrgica.",
    intro: [
      "Una extracción retira un diente de su alveolo. Puede ser simple, cuando el diente es accesible y sale entero con instrumental básico, o quirúrgica, cuando hace falta una pequeña incisión o dividir el diente, como ocurre a menudo con las muelas del juicio incluidas o parcialmente salidas.",
      "Al comparar presupuestos conviene preguntar si la extracción se plantea como simple o quirúrgica, si incluye pruebas de imagen previas y qué tipo de anestesia lleva el precio.",
    ],
    priceFactors: [
      "Si es una extracción simple o quirúrgica",
      "Si el diente está incluido o parcialmente erupcionado (frecuente en muelas del juicio)",
      "Pruebas de imagen previas incluidas o no",
      "Tipo de anestesia o sedación",
      "Número de piezas a extraer en la misma cita",
    ],
    questionsToAsk: [
      "¿La extracción es simple o quirúrgica en mi caso?",
      "¿Está incluida la radiografía o el TAC previo?",
      "¿Qué tipo de anestesia se usa?",
      "¿Hay algo incluido para después de la extracción (revisión, medicación)?",
      "¿El precio cambia si hay que sacar varias piezas?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre una extracción simple y una quirúrgica?",
        answer:
          "La simple se hace con instrumental básico cuando el diente es accesible; la quirúrgica requiere una pequeña incisión o dividir el diente, algo habitual en muelas del juicio incluidas o parcialmente salidas. El precio suele ser distinto para cada tipo.",
      },
      {
        question: "¿Las muelas del juicio siempre se extraen de forma quirúrgica?",
        answer:
          "No siempre. Depende de su posición y de si han salido por completo. Una radiografía o un TAC ayudan a valorar qué tipo de extracción corresponde.",
      },
      {
        question: "¿Qué incluye el precio de una extracción?",
        answer:
          "Varía según la clínica: algunas incluyen la anestesia y una revisión posterior, y otras las facturan aparte. Conviene preguntar el desglose antes de comparar presupuestos.",
      },
      {
        question: "¿Hace falta reponer el diente después de extraerlo?",
        answer:
          "Es una decisión distinta a la extracción en sí, y depende de cada caso. La clínica puede explicar qué opciones existen para reponer una pieza extraída.",
      },
    ],
    synonyms: ["extracción dental", "sacar una muela", "extracción de muelas del juicio", "sacar un diente", "extracción quirúrgica"],
  },
  {
    slug: "corona",
    summary:
      "Funda que recubre por completo un diente dañado o debilitado, fabricada a medida en distintos materiales.",
    intro: [
      "Una corona es una pieza fabricada a medida que recubre por completo un diente, ya sea porque ha perdido mucha estructura -tras una caries grande o una endodoncia- o porque se coloca sobre un implante. Puede ser de metal-cerámica, cerámica pura, circonio u otros materiales.",
      "Al comparar presupuestos conviene fijarse en el material, en si el precio incluye la reconstrucción previa del diente y en si hay una corona provisional mientras se fabrica la definitiva.",
    ],
    priceFactors: [
      "Material de la corona (metal-cerámica, cerámica pura, circonio...)",
      "Si va sobre un diente natural o sobre un implante",
      "Si el precio incluye la reconstrucción previa del muñón",
      "Número de visitas y si hay corona provisional mientras se fabrica la definitiva",
      "Tipo de laboratorio dental",
    ],
    questionsToAsk: [
      "¿Qué material tiene la corona incluida en el presupuesto?",
      "¿El precio incluye la reconstrucción previa si hace falta?",
      "¿Cuántas visitas lleva el proceso?",
      "¿Hay una corona provisional mientras se fabrica la definitiva?",
      "¿Qué garantía tiene la corona?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre una corona de metal-cerámica y una de circonio?",
        answer:
          "Cambia el material base: la de metal-cerámica lleva una estructura metálica recubierta de porcelana, y la de circonio no lleva metal. El precio y el aspecto pueden variar según cuál se use, y la clínica indica con cuál trabaja.",
      },
      {
        question: "¿Una corona es lo mismo que una funda?",
        answer:
          "Es el mismo tipo de pieza; \"funda\" es la forma coloquial de llamar a la corona dental.",
      },
      {
        question: "¿Hace falta una corona provisional mientras se fabrica la definitiva?",
        answer:
          "En muchos tratamientos sí, porque la corona definitiva se fabrica en un laboratorio y no está lista en la misma cita. Si la provisional está incluida en el precio es algo que se puede preguntar.",
      },
      {
        question: "¿La corona se puede poner sobre cualquier diente?",
        answer:
          "Depende de cuánta estructura le quede al diente y de su estado general. La clínica valora si conviene una corona o si basta con otro tipo de reconstrucción.",
      },
    ],
    synonyms: ["corona dental", "funda dental", "corona de circonio", "corona sobre implante", "funda para un diente"],
  },
  {
    slug: "puente",
    summary:
      "Prótesis fija que sustituye una o varias piezas perdidas apoyándose en los dientes o implantes vecinos.",
    intro: [
      "Un puente es una prótesis fija formada por varias coronas unidas, que sustituye una o varias piezas perdidas apoyándose en los dientes naturales o implantes situados a los lados del hueco. Se cementa y no se quita para su limpieza, a diferencia de una prótesis removible.",
      "Al comparar presupuestos conviene fijarse en si se apoya en dientes naturales -lo que implica tallarlos- o en implantes, y en el material del puente.",
    ],
    priceFactors: [
      "Material del puente (metal-cerámica, circonio...)",
      "Número de piezas dentales que sustituye",
      "Si se apoya en dientes naturales (lo que implica tallarlos) o en implantes",
      "Número de visitas y si hay puente provisional",
      "Estado de los dientes o implantes de apoyo",
    ],
    questionsToAsk: [
      "¿El puente se apoya en dientes naturales o en implantes?",
      "¿Hace falta tallar los dientes de los lados?",
      "¿Qué material lleva?",
      "¿Cuántas piezas sustituye el presupuesto?",
      "¿Hay un puente provisional mientras se fabrica el definitivo?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre un puente y un implante?",
        answer:
          "El puente se apoya en los dientes o implantes vecinos al hueco, mientras que un implante se coloca directamente en el hueso donde falta la pieza. Cada opción tiene implicaciones distintas que la clínica puede explicar.",
      },
      {
        question: "¿Hay que tallar los dientes de al lado para hacer un puente?",
        answer:
          "Cuando el puente se apoya en dientes naturales, suele hacer falta tallarlos para colocar las coronas de sujeción. Si se apoya en implantes, ese tallado no es necesario.",
      },
      {
        question: "¿Un puente se puede quitar para limpiarlo?",
        answer:
          "No, va cementado de forma fija, a diferencia de una prótesis removible. La higiene se hace con el puente puesto, con técnicas específicas para limpiar bajo el conector.",
      },
      {
        question: "¿Cuántos dientes puede sustituir un puente?",
        answer:
          "Depende del caso y del estado de los dientes o implantes de apoyo. La clínica valora cuántas piezas puede cubrir un puente concreto de forma segura.",
      },
    ],
    synonyms: ["puente dental", "puente fijo", "puente sobre implantes", "puente de tres piezas", "prótesis fija dental"],
  },
  {
    slug: "protesis-removible",
    summary:
      "Prótesis dental que sustituye piezas perdidas y que el paciente puede quitar y poner, parcial o completa.",
    intro: [
      "Una prótesis removible sustituye dientes perdidos y se puede quitar y poner. Puede ser parcial, cuando quedan dientes propios y se apoya en ellos con ganchos u otros retenedores, o completa, cuando no queda ningún diente natural en esa arcada y se sostiene sobre la encía, en algunos casos ayudada por implantes.",
      "Al comparar presupuestos conviene fijarse en si es parcial o completa, en el material de la base -resina o esqueleto metálico- y en si se apoya sobre implantes o solo sobre la encía y los dientes remanentes.",
    ],
    priceFactors: [
      "Si es parcial o completa",
      "Material de la base (resina o esqueleto metálico)",
      "Si se apoya sobre implantes o solo sobre la encía y los dientes remanentes",
      "Número de ajustes y revisiones incluidos tras la entrega",
      "Tipo de retenedores en caso de prótesis parcial",
    ],
    questionsToAsk: [
      "¿La prótesis es parcial o completa?",
      "¿De qué material es la base?",
      "¿Se apoya en implantes o solo en la encía?",
      "¿Cuántos ajustes están incluidos después de entregarla?",
      "¿Qué pasa si con el tiempo deja de encajar bien?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre una prótesis parcial y una completa?",
        answer:
          "La parcial se usa cuando quedan dientes propios en la boca y se apoya en ellos; la completa se usa cuando no queda ningún diente natural en esa arcada. Los materiales y el precio cambian según cuál se necesite.",
      },
      {
        question: "¿Una prótesis removible se puede combinar con implantes?",
        answer:
          "Sí, existen prótesis removibles que se sujetan sobre implantes en lugar de apoyarse solo en la encía, lo que cambia la estabilidad y también el precio.",
      },
      {
        question: "¿Hace falta ajustar la prótesis después de entregarla?",
        answer:
          "Es habitual necesitar algún ajuste en las primeras semanas de uso. Si esas visitas están incluidas en el precio inicial es algo que conviene preguntar.",
      },
      {
        question: "¿Una prótesis removible dura para siempre?",
        answer:
          "No hay una duración garantizada: la encía y el hueso cambian con el tiempo, lo que puede afectar al ajuste. La clínica puede explicar qué revisiones periódicas conviene hacer.",
      },
    ],
    synonyms: ["prótesis removible", "dentadura postiza", "prótesis dental parcial", "prótesis completa", "dentadura de quitar y poner"],
  },
  {
    slug: "periodoncia",
    summary:
      "Diagnóstico y tratamiento de las encías y el hueso que sostiene los dientes, cuando hay inflamación o pérdida de soporte.",
    intro: [
      "La periodoncia se centra en las encías y el hueso que sostiene los dientes. Incluye desde el tratamiento de una gingivitis -inflamación de la encía sin pérdida de hueso- hasta procedimientos más profundos, como el raspado y alisado radicular, cuando hay periodontitis y se ha perdido soporte óseo.",
      "Al comparar presupuestos conviene preguntar si el precio es por boca completa o por cuadrante, qué fase del tratamiento cubre y cuántas sesiones de mantenimiento incluye después.",
    ],
    priceFactors: [
      "Fase del tratamiento (raspado y alisado radicular, cirugía periodontal, mantenimiento)",
      "Número de cuadrantes de la boca tratados",
      "Si incluye anestesia local",
      "Número de sesiones de mantenimiento incluidas tras el tratamiento inicial",
      "Pruebas diagnósticas (sondaje, radiografías) incluidas",
    ],
    questionsToAsk: [
      "¿El precio es por boca completa o por cuadrante?",
      "¿Qué fase del tratamiento cubre el presupuesto?",
      "¿Incluye anestesia local?",
      "¿Cuántas sesiones de mantenimiento están incluidas después?",
      "¿El sondaje y las radiografías diagnósticas van aparte?",
    ],
    faqs: [
      {
        question: "¿Qué diferencia hay entre gingivitis y periodontitis?",
        answer:
          "La gingivitis es una inflamación de la encía sin pérdida de hueso, y suele ser reversible con tratamiento e higiene. La periodontitis implica pérdida de soporte óseo alrededor del diente y requiere un abordaje distinto, que valora el periodoncista.",
      },
      {
        question: "¿Qué es el raspado y alisado radicular?",
        answer:
          "Es un procedimiento en el que se limpia en profundidad la raíz del diente, por debajo del borde de la encía, para eliminar placa y sarro que una limpieza normal no alcanza. Suele hacerse por cuadrantes.",
      },
      {
        question: "¿El tratamiento periodontal se hace en una sola visita?",
        answer:
          "Depende del número de cuadrantes afectados y de la técnica utilizada. Algunas clínicas lo hacen en una sesión y otras lo reparten en varias visitas.",
      },
      {
        question: "¿Hace falta mantenimiento después del tratamiento?",
        answer:
          "En muchos casos sí, con revisiones periódicas para controlar el estado de las encías. Si esas sesiones de mantenimiento están incluidas en el presupuesto inicial es algo que conviene preguntar.",
      },
    ],
    synonyms: ["periodoncia", "tratamiento de encías", "piorrea", "raspado y alisado radicular", "enfermedad periodontal"],
  },
  {
    slug: "odontopediatria",
    summary:
      "Atención dental dirigida a bebés, niños y adolescentes, adaptada a cada etapa de su desarrollo dental.",
    intro: [
      "La odontopediatría atiende a bebés, niños y adolescentes, desde la salida de los primeros dientes de leche hasta el recambio por los dientes definitivos. Incluye revisiones periódicas, prevención de caries, tratamiento de caries en dientes de leche y seguimiento del desarrollo de la boca, entre otras cosas.",
      "Al comparar clínicas conviene preguntar qué incluye la primera visita, si ofrecen sellado de fisuras y con qué técnicas gestionan la consulta cuando el niño o la niña está nervioso.",
    ],
    priceFactors: [
      "Qué incluye la primera visita (revisión, radiografías, aplicación de flúor)",
      "Si se ofrecen selladores de fisuras y a qué precio",
      "Técnicas de manejo de la conducta o sedación en tratamientos que lo requieran",
      "Tipo de material usado en empastes de dientes de leche",
      "Frecuencia de revisiones recomendada",
    ],
    questionsToAsk: [
      "¿Qué incluye la primera visita?",
      "¿Hacéis sellado de fisuras y qué precio tiene?",
      "¿Cómo gestionáis la consulta si el niño o la niña está nervioso?",
      "¿Qué material usáis para empastes en dientes de leche?",
      "¿Cada cuánto recomendáis traerlo a revisión?",
    ],
    faqs: [
      {
        question: "¿A partir de qué edad se lleva a un niño al dentista?",
        answer:
          "No hay una edad única fijada; muchas clínicas recomiendan una primera visita en los primeros años de vida, sobre todo si hay dudas sobre la salida de los dientes. Es algo que puede consultarse directamente con la clínica.",
      },
      {
        question: "¿Merece la pena tratar caries en dientes de leche si se van a caer?",
        answer:
          "Es una decisión que depende de cada caso -del dolor, la infección o el tiempo que falte para el recambio- y la valora el odontopediatra junto con la familia. No hay una respuesta única para todos los niños.",
      },
      {
        question: "¿Qué son los selladores de fisuras?",
        answer:
          "Es una capa de resina que se aplica sobre los surcos de las muelas para dificultar que se acumule placa en esas zonas. Muchas clínicas lo ofrecen como parte de la prevención en dentición infantil.",
      },
      {
        question: "¿Hace falta sedación para tratar a un niño pequeño?",
        answer:
          "Depende del tratamiento y de cómo lo lleve el niño o la niña en consulta. Algunas clínicas usan técnicas de manejo de conducta sin sedación y otras la plantean para casos concretos; es algo que se puede preguntar antes de la cita.",
      },
    ],
    synonyms: ["odontopediatría", "dentista infantil", "dentista para niños", "primera visita al dentista niños", "odontólogo pediátrico"],
  },
  {
    slug: "urgencias",
    summary:
      "Atención dental para dolor agudo, traumatismos o problemas que no pueden esperar a una cita programada.",
    intro: [
      "Una urgencia dental es un problema que no puede esperar al calendario habitual de citas: dolor intenso, un golpe con un diente roto o movido, una infección con inflamación, una prótesis o corona que se ha caído, entre otros casos. Cuando el problema es grave -por ejemplo, un traumatismo con un diente que se ha salido por completo, una hemorragia que no cede o una inflamación que dificulta respirar o tragar- lo que corresponde es acudir a un servicio de urgencias, no comparar clínicas en internet.",
      "Para el resto de casos, al comparar clínicas conviene fijarse en si ofrecen cita el mismo día o fuera del horario habitual, qué incluye la consulta de urgencia y si ese importe se descuenta de un tratamiento posterior.",
    ],
    priceFactors: [
      "Si la clínica ofrece cita el mismo día o fuera del horario habitual",
      "Qué incluye la consulta de urgencia (revisión, radiografía, medicación)",
      "Si el importe de la urgencia se descuenta de un tratamiento posterior",
      "Tipo de problema (dolor, traumatismo, infección, prótesis rota)",
      "Si hace falta una prueba de imagen inmediata",
    ],
    questionsToAsk: [
      "¿Tenéis hueco para urgencias el mismo día?",
      "¿Qué incluye el precio de la consulta de urgencia?",
      "¿La radiografía va incluida?",
      "¿Ese importe se descuenta si luego hago el tratamiento completo?",
      "¿Atendéis fuera del horario habitual?",
    ],
    faqs: [
      {
        question: "¿Cuándo hay que ir a un servicio de urgencias en vez de pedir cita en una clínica dental?",
        answer:
          "Ante un traumatismo grave, un diente que se ha salido por completo, una hemorragia que no cede o una inflamación que dificulta respirar o tragar, corresponde acudir a un servicio de urgencias médicas, no buscar y comparar clínicas dentales en internet.",
      },
      {
        question: "¿Qué se considera una urgencia dental?",
        answer:
          "Situaciones como un dolor intenso, un diente roto o movido por un golpe, una infección con inflamación visible o una prótesis o corona que se ha caído y molesta. La gravedad de cada caso concreto la valora un profesional.",
      },
      {
        question: "¿Las clínicas dentales atienden urgencias fuera de su horario habitual?",
        answer:
          "Depende de cada clínica; algunas indican en su ficha si ofrecen atención el mismo día o fuera de horario, y otras no. Conviene comprobarlo con antelación si se busca esa disponibilidad.",
      },
      {
        question: "¿El precio de la consulta de urgencia se descuenta si sigo el tratamiento con esa clínica?",
        answer:
          "Depende de la clínica. Algunas descuentan el importe de la urgencia del tratamiento posterior y otras no, así que es algo que se puede preguntar al pedir la cita.",
      },
    ],
    synonyms: ["urgencias dentales", "dentista de urgencia", "dolor de muelas urgente", "clínica dental urgencias", "diente roto urgencia"],
  },
];

const POR_SLUG = new Map(TREATMENT_CONTENT.map((t) => [t.slug, t]));

/** Contenido editorial de un tratamiento, o `undefined` si aún no se ha escrito. */
export function treatmentContent(slug: string): TreatmentContent | undefined {
  return POR_SLUG.get(slug);
}

/** Slugs que ya tienen contenido editorial propio. */
export function treatmentsWithContent(): string[] {
  return TREATMENT_CONTENT.map((t) => t.slug);
}
