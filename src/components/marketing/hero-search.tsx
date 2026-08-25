"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { paths } from "@/lib/seo/urls";
import { Search } from "lucide-react";
import { Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type SearchTreatment = { id: string; slug: string; name: string };
export type SearchCity = { id: string; slug: string; name: string };

export function HeroSearch({
  treatments,
  cities,
}: {
  treatments: SearchTreatment[];
  cities: SearchCity[];
}) {
  const router = useRouter();
  const [treatment, setTreatment] = useState("");
  const [city, setCity] = useState("");
  const [touched, setTouched] = useState(false);

  const canSubmit = useMemo(() => Boolean(treatment && city), [treatment, city]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!treatment || !city) return;
    router.push(`/${treatment}/${city}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-shadow rounded-brand border border-white/10 bg-white p-3 sm:p-4"
      aria-label="Buscar clínica dental"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="hero-treatment" className="text-anthracite">
            ¿Qué necesitas?
          </Label>
          <Select
            id="hero-treatment"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            aria-invalid={touched && !treatment}
          >
            <option value="">Selecciona un tratamiento</option>
            {treatments.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="hero-city" className="text-anthracite">
            ¿Dónde?
          </Label>
          <Select
            id="hero-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-invalid={touched && !city}
          >
            <option value="">Selecciona un municipio</option>
            {cities.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" size="lg" disabled={treatments.length === 0 || cities.length === 0}>
          <Search className="size-4" aria-hidden="true" />
          Buscar
        </Button>
      </div>
      {touched && !canSubmit ? (
        <p className="mt-2 text-[13px] text-negative">
          Selecciona un tratamiento y un municipio para continuar.
        </p>
      ) : null}
      <p className="mt-3 text-center text-[13.5px] text-grey sm:text-left">
        ¿Prefieres escribirlo?{" "}
        <Link href={paths.search()} className="font-medium text-cyan-deep underline hover:text-cyan-brand">
          Busca por texto
        </Link>{" "}
        — también puedes buscar una clínica por su nombre.
      </p>
    </form>
  );
}
