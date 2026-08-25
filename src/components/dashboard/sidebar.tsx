"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  BarChart3,
  Wallet,
  Building2,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/posiciones", label: "Posiciones", icon: TrendingUp },
  { href: "/dashboard/analytics", label: "Analítica", icon: BarChart3 },
  { href: "/dashboard/saldo", label: "Saldo", icon: Wallet },
  { href: "/dashboard/clinica", label: "Mi clínica", icon: Building2 },
  { href: "/dashboard/equipo", label: "Equipo", icon: UsersRound },
] as const;

export function DashboardSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const clinicParam = searchParams.get("clinic");
  const suffix = clinicParam ? `?clinic=${encodeURIComponent(clinicParam)}` : "";

  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Navegación del panel">
      {NAV.map((item) => {
        const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={`${item.href}${suffix}`}
            className={cn(
              "flex items-center gap-3 rounded-brand px-3.5 py-2.5 font-display text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors",
              active
                ? "bg-cyan-brand text-white"
                : "text-grey-soft hover:bg-white/5 hover:text-white",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
