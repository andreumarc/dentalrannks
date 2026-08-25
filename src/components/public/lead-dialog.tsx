"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { LeadForm } from "@/components/public/lead-form";
import { trackLeadFormOpen } from "@/components/public/lead-track";
import type { LeadSource } from "@prisma/client";

/**
 * Botón "Solicitar valoración" que abre el formulario en un modal.
 * Cada tarjeta de resultado gestiona su propio diálogo de forma independiente.
 */
export function LeadDialogButton({
  clinicId,
  clinicName,
  treatmentId = null,
  cityId = null,
  marketId = null,
  source = "SEARCH_RESULTS",
  position = null,
  sponsored = false,
  treatments,
  label = "Solicitar valoración",
  buttonVariant = "primary",
  buttonSize = "md",
  className,
}: {
  clinicId: string;
  clinicName: string;
  treatmentId?: string | null;
  cityId?: string | null;
  marketId?: string | null;
  source?: LeadSource;
  position?: number | null;
  sponsored?: boolean;
  treatments?: { id: string; name: string }[];
  label?: string;
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          void trackLeadFormOpen({ clinicId, marketId, treatmentId, cityId, position, sponsored });
        }
      }}
    >
      <Dialog.Trigger asChild>
        <Button type="button" variant={buttonVariant} size={buttonSize} className={className}>
          {label}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[101] max-h-[92vh] w-[calc(100%-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-brand border border-line bg-white p-6 shadow-drop focus:outline-none sm:p-7"
          aria-describedby={undefined}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="font-display text-[18px] font-semibold uppercase tracking-[0.03em] text-ink">
              Pedir valoración gratuita
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="cursor-pointer rounded-brand p-1.5 text-grey hover:bg-mist hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <LeadForm
            clinicId={clinicId}
            clinicName={clinicName}
            treatmentId={treatmentId}
            cityId={cityId}
            marketId={marketId}
            source={source}
            treatments={treatments}
            onSuccess={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
