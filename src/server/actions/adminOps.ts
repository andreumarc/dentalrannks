"use server";

/**
 * Envoltorios de Server Actions.
 *
 * Next.js exige que un modulo importado desde un Componente de Cliente y que
 * contenga Server Actions exporte UNICAMENTE funciones asincronas. La logica
 * vive en "@/server/adminOps"; aqui solo se expone la superficie llamable desde el
 * cliente. Cada accion resuelve la sesion en servidor por su cuenta.
 */

import * as impl from "@/server/adminOps";


export async function changeClinicStatusAction(
  ...args: Parameters<typeof impl.changeClinicStatusAction>
): ReturnType<typeof impl.changeClinicStatusAction> {
  return impl.changeClinicStatusAction(...args);
}

export async function changeClinicVerificationAction(
  ...args: Parameters<typeof impl.changeClinicVerificationAction>
): ReturnType<typeof impl.changeClinicVerificationAction> {
  return impl.changeClinicVerificationAction(...args);
}

export async function previewEnrichmentAction(
  ...args: Parameters<typeof impl.previewEnrichmentAction>
): ReturnType<typeof impl.previewEnrichmentAction> {
  return impl.previewEnrichmentAction(...args);
}

export async function applyEnrichmentAction(
  ...args: Parameters<typeof impl.applyEnrichmentAction>
): ReturnType<typeof impl.applyEnrichmentAction> {
  return impl.applyEnrichmentAction(...args);
}

export async function createMarketAction(
  ...args: Parameters<typeof impl.createMarketAction>
): ReturnType<typeof impl.createMarketAction> {
  return impl.createMarketAction(...args);
}

export async function changeMarketStatusAction(
  ...args: Parameters<typeof impl.changeMarketStatusAction>
): ReturnType<typeof impl.changeMarketStatusAction> {
  return impl.changeMarketStatusAction(...args);
}

export async function updateMarketParamsAction(
  ...args: Parameters<typeof impl.updateMarketParamsAction>
): ReturnType<typeof impl.updateMarketParamsAction> {
  return impl.updateMarketParamsAction(...args);
}

export async function reviewLeadQualityAction(
  ...args: Parameters<typeof impl.reviewLeadQualityAction>
): ReturnType<typeof impl.reviewLeadQualityAction> {
  return impl.reviewLeadQualityAction(...args);
}

export async function toggleUserActiveAction(
  ...args: Parameters<typeof impl.toggleUserActiveAction>
): ReturnType<typeof impl.toggleUserActiveAction> {
  return impl.toggleUserActiveAction(...args);
}

export async function changeUserRoleAction(
  ...args: Parameters<typeof impl.changeUserRoleAction>
): ReturnType<typeof impl.changeUserRoleAction> {
  return impl.changeUserRoleAction(...args);
}

export async function previewCsvImportAction(
  ...args: Parameters<typeof impl.previewCsvImportAction>
): ReturnType<typeof impl.previewCsvImportAction> {
  return impl.previewCsvImportAction(...args);
}

export async function confirmCsvImportAction(
  ...args: Parameters<typeof impl.confirmCsvImportAction>
): ReturnType<typeof impl.confirmCsvImportAction> {
  return impl.confirmCsvImportAction(...args);
}

export async function markIpBurstAsSpamAction(
  ...args: Parameters<typeof impl.markIpBurstAsSpamAction>
): ReturnType<typeof impl.markIpBurstAsSpamAction> {
  return impl.markIpBurstAsSpamAction(...args);
}

export async function markDuplicateBucketAction(
  ...args: Parameters<typeof impl.markDuplicateBucketAction>
): ReturnType<typeof impl.markDuplicateBucketAction> {
  return impl.markDuplicateBucketAction(...args);
}
