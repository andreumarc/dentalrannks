"use client";

import { useActionState, useEffect, useState } from "react";
import { Input, Label, Textarea, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InfoNote } from "@/components/ui/states";
import { previewEnrichmentAction, applyEnrichmentAction } from "@/server/actions/adminOps";
import type { EnrichmentPreviewState, AdminFormState } from "@/server/adminOps";

const previewInitial: EnrichmentPreviewState = { ok: false };
const applyInitial: AdminFormState = { ok: false };

export function EnrichmentPanel({ clinicId, website }: { clinicId: string; website: string | null }) {
  const [previewState, previewAction, previewPending] = useActionState(previewEnrichmentAction, previewInitial);
  const [applyState, applyAction, applyPending] = useActionState(applyEnrichmentAction, applyInitial);

  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (previewState.ok && previewState.data) {
      setTagline(previewState.data.title ?? "");
      setDescription(previewState.data.description ?? "");
      setLogoUrl(previewState.data.logoUrl ?? "");
    }
  }, [previewState]);

  if (!website) {
    return <InfoNote>Esta clínica no tiene web configurada: no se puede sugerir contenido automáticamente.</InfoNote>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13.5px] text-grey">
        Se ejecuta manualmente y solo sugiere datos: revisa y edita cada campo antes de guardarlo en la ficha.
      </p>

      <form action={previewAction}>
        <input type="hidden" name="clinicId" value={clinicId} />
        <Button type="submit" variant="outline" size="sm" disabled={previewPending}>
          {previewPending ? "Leyendo la web…" : `Enriquecer desde ${website}`}
        </Button>
      </form>

      {!previewState.ok && previewState.message ? (
        <p className="text-[13px] text-negative">{previewState.message}</p>
      ) : null}

      {previewState.ok && previewState.data ? (
        <form action={applyAction} className="flex flex-col gap-4 rounded-brand border border-line bg-mist p-4">
          <input type="hidden" name="clinicId" value={clinicId} />
          <div>
            <Label htmlFor="tagline">Titular sugerido (editable)</Label>
            <Input id="tagline" name="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={160} />
          </div>
          <div>
            <Label htmlFor="description">Descripción sugerida (editable)</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
            />
          </div>
          <div>
            <Label htmlFor="logoUrl">Logo sugerido (URL, editable)</Label>
            <Input id="logoUrl" name="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} maxLength={500} />
            {previewState.data.faviconUrl ? (
              <p className="mt-1 text-[12px] text-grey-light">Favicon detectado: {previewState.data.faviconUrl}</p>
            ) : null}
          </div>
          <FieldError>{!applyState.ok ? applyState.message : null}</FieldError>
          <Button type="submit" size="sm" disabled={applyPending}>
            {applyPending ? "Guardando…" : "Guardar en la ficha"}
          </Button>
          {applyState.ok && applyState.message ? <p className="text-[13px] text-positive">{applyState.message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
