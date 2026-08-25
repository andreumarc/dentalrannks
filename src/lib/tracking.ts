export type UtmParams = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

export function extractUtm(params: URLSearchParams): UtmParams {
  const take = (k: string) => {
    const v = params.get(k);
    return v ? v.slice(0, 120) : null;
  };
  return {
    utmSource: take("utm_source"),
    utmMedium: take("utm_medium"),
    utmCampaign: take("utm_campaign"),
  };
}

/** Los enlaces salientes pasan por /r para poder contabilizar el clic. */
export function trackedHref(params: {
  clinicId: string;
  type: string;
  target: string;
  marketId?: string | null;
  treatmentId?: string | null;
  cityId?: string | null;
  position?: number | null;
  sponsored?: boolean;
}): string {
  const q = new URLSearchParams({
    c: params.clinicId,
    t: params.type,
    to: params.target,
  });
  if (params.marketId) q.set("m", params.marketId);
  if (params.treatmentId) q.set("tr", params.treatmentId);
  if (params.cityId) q.set("ci", params.cityId);
  if (params.position) q.set("p", String(params.position));
  if (params.sponsored) q.set("s", "1");
  return `/r?${q.toString()}`;
}
