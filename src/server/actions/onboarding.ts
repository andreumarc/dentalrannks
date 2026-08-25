"use server";

/**
 * Envoltorios de Server Actions.
 *
 * Next.js exige que un modulo importado desde un Componente de Cliente y que
 * contenga Server Actions exporte UNICAMENTE funciones asincronas. La logica
 * vive en "@/server/onboarding"; aqui solo se expone la superficie llamable desde el
 * cliente. Cada accion resuelve la sesion en servidor por su cuenta.
 */

import * as impl from "@/server/onboarding";


export async function loginAction(
  ...args: Parameters<typeof impl.loginAction>
): ReturnType<typeof impl.loginAction> {
  return impl.loginAction(...args);
}

export async function signupClinicAction(
  ...args: Parameters<typeof impl.signupClinicAction>
): ReturnType<typeof impl.signupClinicAction> {
  return impl.signupClinicAction(...args);
}
