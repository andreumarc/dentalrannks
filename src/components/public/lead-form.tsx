"use client";

import Link from "next/link";
import { useActionState, useId, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Loader2, CheckCircle2 } from "lucide-react";
import { submitLead, type LeadActionState } from "@/server/leads";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CONSENT_TEXTS } from "@/lib/consent";
import { cn } from "@/lib/utils";
import type { LeadSource } from "@prisma/client";

const INITIAL_STATE: LeadActionState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Enviando…
        </>
      ) : (
        "Enviar solicitud"
      )}
    </Button>
  );
}

function ConsentCheckbox({
  id,
  name,
  required,
  children,
  error,
}: {
  id: string;
  name: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <CheckboxPrimitive.Root
          id={id}
          name={name}
          value="on"
          required={required}
          aria-invalid={Boolean(error)}
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border-2 border-line bg-white transition-colors",
            "data-[state=checked]:border-cyan-brand data-[state=checked]:bg-cyan-brand",
            "aria-[invalid=true]:border-negative",
          )}
        >
          <CheckboxPrimitive.Indicator>
            <Check className="size-3.5 text-white" strokeWidth={3} />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        <span className="text-[13.5px] leading-relaxed text-grey">
          {children}
          {required ? <span className="text-negative"> *</span> : null}
        </span>
      </label>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function LeadForm({
  clinicId,
  clinicName,
  treatmentId = null,
  cityId = null,
  marketId = null,
  source = "SEARCH_RESULTS",
  treatments,
  onSuccess,
}: {
  clinicId: string;
  clinicName: string;
  treatmentId?: string | null;
  cityId?: string | null;
  marketId?: string | null;
  source?: LeadSource;
  /** Si no hay un tratamiento fijado por contexto, se ofrece a elegir. */
  treatments?: { id: string; name: string }[];
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(submitLead, INITIAL_STATE);
  const uid = useId();

  if (state.ok) {
    return (
      <div className="rounded-brand border border-positive/30 bg-positive-tint px-5 py-6 text-center">
        <CheckCircle2 className="mx-auto size-9 text-positive" aria-hidden="true" />
        <p className="mt-3 font-display text-[16px] font-semibold uppercase tracking-[0.04em] text-ink">
          Solicitud enviada
        </p>
        <p className="mt-1.5 text-[14.5px] text-grey">{state.message}</p>
        {onSuccess ? (
          <Button variant="outline" size="sm" className="mt-5" onClick={onSuccess} type="button">
            Cerrar
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="clinicId" value={clinicId} />
      <input type="hidden" name="cityId" value={cityId ?? ""} />
      <input type="hidden" name="marketId" value={marketId ?? ""} />
      <input type="hidden" name="source" value={source} />
      {treatmentId ? <input type="hidden" name="treatmentId" value={treatmentId} /> : null}

      {/* Campo trampa contra bots: debe llegar siempre vacío y oculto a personas. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${uid}-website`}>No rellenar este campo</label>
        <input
          id={`${uid}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <p className="text-[13.5px] text-grey">
        Solicita valoración con <strong className="text-ink">{clinicName}</strong>. Te
        contactarán directamente para concretar cita.
      </p>

      {state.message && !state.ok ? (
        <p role="alert" className="rounded-brand border border-negative/30 bg-negative-tint px-3.5 py-2.5 text-[13.5px] text-negative">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${uid}-name`}>Nombre y apellidos</Label>
          <Input
            id={`${uid}-name`}
            name="name"
            autoComplete="name"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          <FieldError>{state.fieldErrors?.name}</FieldError>
        </div>
        <div>
          <Label htmlFor={`${uid}-phone`}>Teléfono</Label>
          <Input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            aria-invalid={Boolean(state.fieldErrors?.phone)}
          />
          <FieldError>{state.fieldErrors?.phone}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor={`${uid}-email`}>Email</Label>
        <Input
          id={`${uid}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${uid}-postalCode`}>Código postal (opcional)</Label>
          <Input
            id={`${uid}-postalCode`}
            name="postalCode"
            inputMode="numeric"
            maxLength={5}
            aria-invalid={Boolean(state.fieldErrors?.postalCode)}
          />
          <FieldError>{state.fieldErrors?.postalCode}</FieldError>
        </div>
        <div>
          <Label htmlFor={`${uid}-timePreference`}>Horario preferido</Label>
          <Select id={`${uid}-timePreference`} name="timePreference" defaultValue="ANY">
            <option value="ANY">Cualquier horario</option>
            <option value="MORNING">Mañanas</option>
            <option value="AFTERNOON">Tardes</option>
          </Select>
        </div>
      </div>

      {!treatmentId && treatments && treatments.length > 0 ? (
        <div>
          <Label htmlFor={`${uid}-treatmentId`}>Tratamiento de interés (opcional)</Label>
          <Select id={`${uid}-treatmentId`} name="treatmentId" defaultValue="">
            <option value="">Sin especificar</option>
            {treatments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div>
        <Label htmlFor={`${uid}-comment`}>Comentario (opcional)</Label>
        <Textarea
          id={`${uid}-comment`}
          name="comment"
          maxLength={600}
          placeholder="Cuéntanos brevemente qué necesitas (sin datos de salud, por favor)."
          aria-invalid={Boolean(state.fieldErrors?.comment)}
        />
        <FieldError>{state.fieldErrors?.comment}</FieldError>
      </div>

      <div className="space-y-3 border-t border-line pt-4">
        <ConsentCheckbox
          id={`${uid}-consentDataSharing`}
          name="consentDataSharing"
          required
          error={state.fieldErrors?.consentDataSharing}
        >
          {CONSENT_TEXTS.DATA_SHARING}
        </ConsentCheckbox>
        <ConsentCheckbox id={`${uid}-consentMarketing`} name="consentMarketing">
          {CONSENT_TEXTS.MARKETING}
        </ConsentCheckbox>
      </div>

      <SubmitButton />

      <p className="text-center text-[12px] text-grey-light">
        DentalRank no solicita ni almacena información sobre tu salud. Consulta nuestra{" "}
        <Link href="/legal/privacidad" className="underline hover:text-cyan-deep">
          política de privacidad
        </Link>
        .
      </p>
    </form>
  );
}
