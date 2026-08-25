"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/states";

export default function LeadDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorNote
      title="No se ha podido cargar este lead"
      message="Puede que ya no tengas acceso o que haya ocurrido un error inesperado."
      action={
        <Button onClick={reset} size="sm">
          Reintentar
        </Button>
      }
    />
  );
}
