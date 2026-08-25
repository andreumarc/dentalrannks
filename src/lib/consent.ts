/**
 * Versionado de los textos de consentimiento.
 * Cada lead guarda qué versión aceptó, cuándo y desde dónde (GDPR / LOPDGDD).
 * Los consentimientos son SEPARADOS: nunca una única casilla para todo.
 */
export const CONSENT_VERSION = "2026-08-v1";

export const CONSENT_TEXTS = {
  DATA_SHARING:
    "Acepto que mis datos sean enviados a la clínica seleccionada para gestionar mi solicitud.",
  MARKETING:
    "Quiero recibir comunicaciones comerciales de DentalRank sobre clínicas, tratamientos y promociones.",
} as const;

export type ConsentKind = keyof typeof CONSENT_TEXTS;
