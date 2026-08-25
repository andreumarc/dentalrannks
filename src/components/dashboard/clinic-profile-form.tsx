"use client";

import { useActionState } from "react";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateClinicProfileAction } from "@/server/actions/dashboard";
import type { ProfileFormState } from "@/server/dashboard";

const initialState: ProfileFormState = { ok: false, message: "" };

type ClinicData = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string;
  postalCode: string;
  firstVisitFree: boolean;
  financing: boolean;
  emergency24h: boolean;
  parking: boolean;
  accessible: boolean;
  languages: string[];
  diagnostics: string[];
};

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-[14px] text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-cyan-brand" />
      {label}
    </label>
  );
}

export function ClinicProfileForm({ clinic }: { clinic: ClinicData }) {
  const [state, formAction, pending] = useActionState(updateClinicProfileAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="clinicId" value={clinic.id} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre de la clínica</Label>
          <Input id="name" name="name" defaultValue={clinic.name} required />
          <FieldError>{errors.name}</FieldError>
        </div>
        <div>
          <Label htmlFor="tagline">Eslogan corto</Label>
          <Input id="tagline" name="tagline" defaultValue={clinic.tagline ?? ""} maxLength={160} />
          <FieldError>{errors.tagline}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" defaultValue={clinic.description ?? ""} rows={5} maxLength={4000} />
        <FieldError>{errors.description}</FieldError>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" defaultValue={clinic.phone} required />
          <FieldError>{errors.phone}</FieldError>
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={clinic.whatsapp ?? ""} />
          <FieldError>{errors.whatsapp}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Email de contacto</Label>
          <Input id="email" name="email" type="email" defaultValue={clinic.email ?? ""} />
          <FieldError>{errors.email}</FieldError>
        </div>
        <div>
          <Label htmlFor="website">Web</Label>
          <Input id="website" name="website" defaultValue={clinic.website ?? ""} placeholder="https://" />
          <FieldError>{errors.website}</FieldError>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" name="address" defaultValue={clinic.address} required />
          <FieldError>{errors.address}</FieldError>
        </div>
        <div>
          <Label htmlFor="postalCode">Código postal</Label>
          <Input id="postalCode" name="postalCode" defaultValue={clinic.postalCode} required />
          <FieldError>{errors.postalCode}</FieldError>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="languages">Idiomas (separados por coma)</Label>
          <Input id="languages" name="languages" defaultValue={clinic.languages.join(", ")} />
        </div>
        <div>
          <Label htmlFor="diagnostics">Diagnóstico / equipamiento (separados por coma)</Label>
          <Input id="diagnostics" name="diagnostics" defaultValue={clinic.diagnostics.join(", ")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Checkbox name="firstVisitFree" label="Primera visita gratis" defaultChecked={clinic.firstVisitFree} />
        <Checkbox name="financing" label="Financiación" defaultChecked={clinic.financing} />
        <Checkbox name="emergency24h" label="Urgencias 24h" defaultChecked={clinic.emergency24h} />
        <Checkbox name="parking" label="Parking" defaultChecked={clinic.parking} />
        <Checkbox name="accessible" label="Accesible" defaultChecked={clinic.accessible} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
        {state.message ? (
          <span className={`text-[13.5px] ${state.ok ? "text-positive" : "text-negative"}`}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
