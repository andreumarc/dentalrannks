import { Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export function NoClinicsState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4">
      <EmptyState
        className="max-w-lg bg-white"
        icon={<Building2 className="size-6" />}
        title="Todavía no tienes clínicas"
        description="Da de alta tu clínica para acceder al panel de leads, posiciones patrocinadas y analítica."
        action={
          <Button asChild>
            <Link href="/alta-clinica">Dar de alta mi clínica</Link>
          </Button>
        }
      />
    </div>
  );
}
