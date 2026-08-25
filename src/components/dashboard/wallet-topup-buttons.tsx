"use client";

import { useState, useTransition } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InfoNote } from "@/components/ui/states";

const PRESETS = [100, 250, 500, 1000];

export function WalletTopUpButtons({ clinicId }: { clinicId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const startCheckout = (amountEuros: number) => {
    if (!Number.isFinite(amountEuros) || amountEuros <= 0) {
      setError("Introduce un importe válido.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinicId, amountEuros }),
        });
        const data = await res.json().catch(() => null);
        if (data?.disabled) {
          setDisabled(true);
          return;
        }
        if (!res.ok || !data?.url) {
          setError("No se ha podido iniciar el pago. Inténtalo de nuevo.");
          return;
        }
        window.location.href = data.url as string;
      } catch {
        setError("No se ha podido conectar con el proveedor de pagos.");
      }
    });
  };

  if (disabled) {
    return (
      <InfoNote tone="warning">
        Los pagos todavía no están configurados en este entorno. Contacta con soporte para recargar saldo
        manualmente.
      </InfoNote>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((euros) => (
          <Button key={euros} type="button" variant="dark" size="sm" disabled={pending} onClick={() => startCheckout(euros)}>
            +{euros} €
          </Button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <div>
          <Label htmlFor="custom-amount">Otro importe (€)</Label>
          <Input
            id="custom-amount"
            type="number"
            min={50}
            step="1"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-40"
          />
        </div>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => startCheckout(Number(customAmount))}>
          Recargar
        </Button>
      </div>
      {error ? <p className="text-[13px] text-negative">{error}</p> : null}
    </div>
  );
}
