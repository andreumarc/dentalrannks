import { headers } from "next/headers";

export async function getClientContext() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  return {
    ip,
    userAgent: h.get("user-agent"),
    referrer: h.get("referer"),
  };
}

export function clientContextFromRequest(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
  return {
    ip,
    userAgent: req.headers.get("user-agent"),
    referrer: req.headers.get("referer"),
  };
}
