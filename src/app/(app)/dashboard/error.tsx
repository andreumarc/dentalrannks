"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/states";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <ErrorNote
        title="No se ha podido cargar el panel"
        message="Ha ocurrido un error inesperado. Puedes intentarlo de nuevo; si persiste, contacta con soporte."
        action={
          <Button onClick={reset} size="sm">
            Reintentar
          </Button>
        }
      />
    </div>
  );
}
