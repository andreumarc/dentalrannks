/**
 * Ejecuta una consulta de solo lectura tolerando un fallo puntual de la base
 * de datos (por ejemplo, durante el build o una regeneración ISR).
 *
 * Se usa únicamente en lecturas de contenido público: una caída momentánea
 * debe degradar la página, nunca tumbar el despliegue. Jamás debe emplearse
 * para operaciones que impliquen autorización o dinero.
 */
export async function safeRead<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[dentalrank] lectura degradada en ${label}:`, error);
    return fallback;
  }
}
