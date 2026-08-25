"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Landmark,
  TrendingUp,
  Gavel,
  Users,
  CreditCard,
  UserCog,
  Upload,
  ShieldAlert,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/clinicas", label: "Clínicas", icon: Building2 },
  { href: "/admin/organizaciones", label: "Organizaciones", icon: Landmark },
  { href: "/admin/mercados", label: "Mercados", icon: TrendingUp },
  { href: "/admin/pujas", label: "Pujas", icon: Gavel },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/pagos", label: "Pagos", icon: CreditCard },
  { href: "/admin/usuarios", label: "Usuarios", icon: UserCog },
  { href: "/admin/importacion", label: "Importación", icon: Upload },
  { href: "/admin/fraude", label: "Fraude", icon: ShieldAlert },
  { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Navegación de administración">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-brand px-3.5 py-2.5 font-display text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors",
              active ? "bg-cyan-brand text-white" : "text-grey-soft hover:bg-white/5 hover:text-white",
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
