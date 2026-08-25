"use client";

import { useActionState } from "react";
import { Input, Label, Select, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createMarketAction } from "@/server/actions/adminOps";
import type { AdminFormState } from "@/server/adminOps";

const initialState: AdminFormState = { ok: false };

export function MarketCreateForm({
  treatments,
  cities,
}: {
  treatments: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createMarketAction, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <Label htmlFor="treatmentId">Tratamiento</Label>
        <Select id="treatmentId" name="treatmentId" required defaultValue="">
          <option value="" disabled>
            Selecciona
          </option>
          {treatments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="cityId">Municipio</Label>
        <Select id="cityId" name="cityId" required defaultValue="">
          <option value="" disabled>
            Selecciona
          </option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="pricingModel">Modelo de precio</Label>
        <Select id="pricingModel" name="pricingModel" defaultValue="BALANCE">
          <option value="BALANCE">Saldo comprometido</option>
          <option value="CPC">Coste por clic</option>
          <option value="CPL">Coste por lead</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="minimumBidEuros">Puja mínima (€)</Label>
        <Input id="minimumBidEuros" name="minimumBidEuros" type="number" min={0} step="1" defaultValue={50} required />
      </div>
      <div>
        <Label htmlFor="bidIncrementEuros">Incremento (€)</Label>
        <Input id="bidIncrementEuros" name="bidIncrementEuros" type="number" min={0.5} step="0.5" defaultValue={10} required />
      </div>
      <div>
        <Label htmlFor="sponsoredSlots">Nº de posiciones patrocinadas</Label>
        <Input id="sponsoredSlots" name="sponsoredSlots" type="number" min={1} max={10} defaultValue={3} required />
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <FieldError>{!state.ok ? state.message : null}</FieldError>
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear mercado"}
        </Button>
        {state.ok && state.message ? <p className="mt-2 text-[13px] text-positive">{state.message}</p> : null}
      </div>
    </form>
  );
}
