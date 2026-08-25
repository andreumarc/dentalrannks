"use server";

/**
 * Envoltorios de Server Actions.
 *
 * Next.js exige que un modulo importado desde un Componente de Cliente y que
 * contenga Server Actions exporte UNICAMENTE funciones asincronas. La logica
 * vive en "@/server/dashboard"; aqui solo se expone la superficie llamable desde el
 * cliente. Cada accion resuelve la sesion en servidor por su cuenta.
 */

import * as impl from "@/server/dashboard";


export async function updateClinicProfileAction(
  ...args: Parameters<typeof impl.updateClinicProfileAction>
): ReturnType<typeof impl.updateClinicProfileAction> {
  return impl.updateClinicProfileAction(...args);
}

export async function saveClinicTreatmentsAction(
  ...args: Parameters<typeof impl.saveClinicTreatmentsAction>
): ReturnType<typeof impl.saveClinicTreatmentsAction> {
  return impl.saveClinicTreatmentsAction(...args);
}

export async function inviteTeamMemberAction(
  ...args: Parameters<typeof impl.inviteTeamMemberAction>
): ReturnType<typeof impl.inviteTeamMemberAction> {
  return impl.inviteTeamMemberAction(...args);
}
