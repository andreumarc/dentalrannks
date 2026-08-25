"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/states";

export default function SaldoError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorNote
      title="No se ha podido cargar el saldo"
      message="Ha ocurrido un error inesperado al consultar el libro mayor."
      action={
        <Button onClick={reset} size="sm">
          Reintentar
        </Button>
      }
    />
  );
}
