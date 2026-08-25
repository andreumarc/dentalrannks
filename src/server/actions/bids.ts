"use server";

/**
 * Envoltorios de Server Actions.
 *
 * Next.js exige que un modulo importado desde un Componente de Cliente y que
 * contenga Server Actions exporte UNICAMENTE funciones asincronas. La logica
 * vive en "@/server/bids"; aqui solo se expone la superficie llamable desde el
 * cliente. Cada accion resuelve la sesion en servidor por su cuenta.
 */

import * as impl from "@/server/bids";


export async function placeBidAction(
  ...args: Parameters<typeof impl.placeBidAction>
): ReturnType<typeof impl.placeBidAction> {
  return impl.placeBidAction(...args);
}

export async function updateClinicBudgetAction(
  ...args: Parameters<typeof impl.updateClinicBudgetAction>
): ReturnType<typeof impl.updateClinicBudgetAction> {
  return impl.updateClinicBudgetAction(...args);
}
