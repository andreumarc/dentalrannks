"use server";

/**
 * Envoltorios de Server Actions.
 *
 * Next.js exige que un modulo importado desde un Componente de Cliente y que
 * contenga Server Actions exporte UNICAMENTE funciones asincronas. La logica
 * vive en "@/server/crm"; aqui solo se expone la superficie llamable desde el
 * cliente. Cada accion resuelve la sesion en servidor por su cuenta.
 */

import * as impl from "@/server/crm";


export async function changeLeadStatusAction(
  ...args: Parameters<typeof impl.changeLeadStatusAction>
): ReturnType<typeof impl.changeLeadStatusAction> {
  return impl.changeLeadStatusAction(...args);
}

export async function addLeadNoteAction(
  ...args: Parameters<typeof impl.addLeadNoteAction>
): ReturnType<typeof impl.addLeadNoteAction> {
  return impl.addLeadNoteAction(...args);
}

export async function assignLeadAction(
  ...args: Parameters<typeof impl.assignLeadAction>
): ReturnType<typeof impl.assignLeadAction> {
  return impl.assignLeadAction(...args);
}

export async function exportLeadsCsvAction(
  ...args: Parameters<typeof impl.exportLeadsCsvAction>
): ReturnType<typeof impl.exportLeadsCsvAction> {
  return impl.exportLeadsCsvAction(...args);
}
