"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/states";

export default function PosicionesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorNote
      title="No se han podido cargar las posiciones"
      message="Ha ocurrido un error inesperado al consultar los mercados de puja."
      action={
        <Button onClick={reset} size="sm">
          Reintentar
        </Button>
      }
    />
  );
}
