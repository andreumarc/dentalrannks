"use client";

import { useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOutAction } from "@/server/actions/session";
import type { SessionUser } from "@/lib/authz";
import type { ClinicSummary } from "@/server/dashboard";

/**
 * Cabecera del panel. La clínica mostrada se deriva de `?clinic=` igual que en
 * servidor (`resolveActiveClinic`): aquí es solo presentación; toda lectura o
 * escritura de datos revalida el acceso en servidor.
 */
export function DashboardHeader({
  user,
  clinics,
}: {
  user: SessionUser;
  clinics: ClinicSummary[];
}) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("clinic");
  const active = clinics.find((c) => c.id === requested) ?? clinics[0];

  if (!active) return null;

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-white px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <p className="kicker-muted">{active.organizationName}</p>
        <p className="truncate font-display text-[16px] font-semibold uppercase tracking-[0.03em] text-ink">
          {active.name}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-[14px] font-medium text-ink">{user.name ?? user.email}</p>
          <p className="flex items-center justify-end gap-1.5 text-[12.5px] text-grey">
            {active.role === "CLINIC_ADMIN" ? (
              <Badge variant="cyan" size="sm">
                Administrador
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Equipo
              </Badge>
            )}
          </p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="size-4" />
            Salir
          </Button>
        </form>
      </div>
    </header>
  );
}
