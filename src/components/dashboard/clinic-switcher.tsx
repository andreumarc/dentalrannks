"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";
import type { ClinicSummary } from "@/server/dashboard";

export function ClinicSwitcher({ clinics }: { clinics: ClinicSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = clinics.find((c) => c.id === searchParams.get("clinic"))?.id ?? clinics[0]?.id;

  if (clinics.length <= 1) return null;

  return (
    <label className="block w-full max-w-[280px]">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-grey-soft">
        Clínica activa
      </span>
      <Select
        value={activeId}
        className="border-white/15 bg-anthracite-light text-white [&_option]:text-ink"
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("clinic", e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
      >
        {clinics.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} · {c.cityName}
          </option>
        ))}
      </Select>
    </label>
  );
}
