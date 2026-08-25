import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth";
import type { SessionUser } from "@/lib/authz";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export function AdminHeader({ user }: { user: SessionUser }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-white px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <p className="kicker-muted">DentalRank</p>
        <p className="truncate font-display text-[16px] font-semibold uppercase tracking-[0.03em] text-ink">
          Panel de administración
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-[14px] font-medium text-ink">{user.name ?? user.email}</p>
          <Badge variant="dark" size="sm">
            Super admin
          </Badge>
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
