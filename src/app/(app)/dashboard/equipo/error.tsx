"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/states";

export default function EquipoError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorNote
      title="No se ha podido cargar el equipo"
      message="Ha ocurrido un error inesperado al consultar los miembros de la organización."
      action={
        <Button onClick={reset} size="sm">
          Reintentar
        </Button>
      }
    />
  );
}
