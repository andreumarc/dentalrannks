"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Input, Label, Select, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InfoNote } from "@/components/ui/states";
import { signupClinicAction } from "@/server/actions/onboarding";
import type { SignupActionState } from "@/server/onboarding";
import { cn } from "@/lib/utils";

const initialState: SignupActionState = { ok: false };

export type SignupCity = { id: string; slug: string; name: string; province: { name: string } };
export type SignupTreatment = { id: string; name: string; category: { id: string; name: string } };

export function ClinicSignupForm({
  cities,
  treatments,
}: {
  cities: SignupCity[];
  treatments: SignupTreatment[];
}) {
  const [state, formAction, pending] = useActionState(signupClinicAction, initialState);
  const [selectedTreatments, setSelectedTreatments] = useState<Set<string>>(new Set());
  const [citySearch, setCitySearch] = useState("");
  const [selectedCitySlug, setSelectedCitySlug] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; treatments: SignupTreatment[] }>();
    for (const t of treatments) {
      const bucket = map.get(t.category.id) ?? { name: t.category.name, treatments: [] };
      bucket.treatments.push(t);
      map.set(t.category.id, bucket);
    }
    return [...map.values()];
  }, [treatments]);

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    const base = !q
      ? cities.slice(0, 200)
      : cities.filter((c) => c.name.toLowerCase().includes(q) || c.province.name.toLowerCase().includes(q)).slice(0, 200);
    // Si ya hay una ciudad elegida, la mantenemos visible aunque no coincida
    // con el texto de búsqueda actual: seguir escribiendo no debe borrar la selección.
    if (selectedCitySlug && !base.some((c) => c.slug === selectedCitySlug)) {
      const chosen = cities.find((c) => c.slug === selectedCitySlug);
      if (chosen) return [chosen, ...base];
    }
    return base;
  }, [cities, citySearch, selectedCitySlug]);

  function toggleTreatment(id: string) {
    setSelectedTreatments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-10">
      {!state.ok && state.message ? (
        <p role="alert" className="rounded-brand border border-negative/40 bg-negative-tint px-4 py-3 text-[14px] text-negative">
          {state.message}
        </p>
      ) : null}

      <section className="flex flex-col gap-5">
        <h3 className="display-h3 text-ink">Datos de la clínica</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="clinicName">Nombre de la clínica</Label>
            <Input id="clinicName" name="clinicName" placeholder="Clínica Dental Ejemplo" required aria-invalid={Boolean(state.fieldErrors?.clinicName)} />
            <FieldError>{state.fieldErrors?.clinicName}</FieldError>
          </div>
          <div>
            <Label htmlFor="phone">Teléfono de la clínica</Label>
            <Input id="phone" name="phone" type="tel" placeholder="600 000 000" required aria-invalid={Boolean(state.fieldErrors?.phone)} />
            <FieldError>{state.fieldErrors?.phone}</FieldError>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="website">Web de la clínica (opcional)</Label>
            <Input id="website" name="website" type="url" placeholder="https://www.tuclinica.com" aria-invalid={Boolean(state.fieldErrors?.website)} />
            <FieldError>{state.fieldErrors?.website}</FieldError>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" name="address" placeholder="Calle, número" required aria-invalid={Boolean(state.fieldErrors?.address)} />
            <FieldError>{state.fieldErrors?.address}</FieldError>
          </div>
          <div>
            <Label htmlFor="postalCode">Código postal</Label>
            <Input id="postalCode" name="postalCode" inputMode="numeric" maxLength={5} placeholder="28001" required aria-invalid={Boolean(state.fieldErrors?.postalCode)} />
            <FieldError>{state.fieldErrors?.postalCode}</FieldError>
          </div>
          <div>
            <Label htmlFor="citySearch">Municipio</Label>
            <Input
              id="citySearch"
              placeholder="Buscar municipio…"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="mb-2"
            />
            <Select
              id="citySlug"
              name="citySlug"
              required
              value={selectedCitySlug}
              onChange={(e) => setSelectedCitySlug(e.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.citySlug)}
            >
              <option value="" disabled>
                Selecciona un municipio
              </option>
              {filteredCities.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name} ({c.province.name})
                </option>
              ))}
            </Select>
            <FieldError>{state.fieldErrors?.citySlug}</FieldError>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h3 className="display-h3 text-ink">Acceso al panel</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="contactName">Tu nombre</Label>
            <Input id="contactName" name="contactName" placeholder="Nombre y apellidos" required aria-invalid={Boolean(state.fieldErrors?.contactName)} />
            <FieldError>{state.fieldErrors?.contactName}</FieldError>
          </div>
          <div>
            <Label htmlFor="email">Email de acceso</Label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="tu@email.com" required aria-invalid={Boolean(state.fieldErrors?.email)} />
            <FieldError>{state.fieldErrors?.email}</FieldError>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres, con letras y números" required aria-invalid={Boolean(state.fieldErrors?.password)} />
            <FieldError>{state.fieldErrors?.password}</FieldError>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="display-h3 text-ink">Tratamientos que ofrece la clínica</h3>
          <p className="mt-1 text-[13.5px] text-grey">Se usan para activar tu ficha en los mercados de tu municipio.</p>
        </div>
        <div className="flex flex-col gap-5">
          {grouped.map((group) => (
            <div key={group.name}>
              <p className="kicker-muted mb-2">{group.name}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.treatments.map((t) => {
                  const checked = selectedTreatments.has(t.id);
                  return (
                    <label
                      key={t.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-brand border px-3.5 py-2.5 text-[14px] transition-colors",
                        checked ? "border-cyan-brand bg-cyan-tint text-cyan-deep" : "border-line text-ink hover:bg-mist",
                      )}
                    >
                      <input
                        type="checkbox"
                        name="treatmentIds"
                        value={t.id}
                        checked={checked}
                        onChange={() => toggleTreatment(t.id)}
                        className="size-4 accent-cyan-brand"
                      />
                      {t.name}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <FieldError>{state.fieldErrors?.treatmentIds}</FieldError>
      </section>

      <InfoNote tone="cyan">
        Tu ficha se crea en estado <strong>borrador</strong> y pasa por una revisión del equipo de DentalRank antes de
        publicarse en el marketplace. Podrás completar el resto de tu perfil (fotos, horarios, equipo…) desde el panel
        en cuanto entres.
      </InfoNote>

      <section className="flex flex-col gap-3">
        <label className="flex items-start gap-2.5 text-[13.5px] text-grey">
          <input type="checkbox" name="acceptTerms" required className="mt-0.5 size-4 accent-cyan-brand" />
          <span>
            Acepto las{" "}
            <Link href="/legal/condiciones" target="_blank" className="text-cyan-deep underline">
              condiciones del servicio
            </Link>{" "}
            y la{" "}
            <Link href="/legal/privacidad" target="_blank" className="text-cyan-deep underline">
              política de privacidad
            </Link>{" "}
            de DentalRank para clínicas.
          </span>
        </label>
        <FieldError>{state.fieldErrors?.acceptTerms}</FieldError>
      </section>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creando tu clínica…" : "Dar de alta mi clínica"}
      </Button>
    </form>
  );
}
