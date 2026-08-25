import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { requireSuperAdmin } from "@/lib/authz";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-mist lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="flex flex-col gap-6 bg-anthracite px-4 py-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Link href="/admin" className="px-1">
          <Logo inverted size={32} subtitle="Administración" />
        </Link>
        <AdminSidebar />
        <div className="mt-auto pt-6 text-[11.5px] leading-relaxed text-grey-soft">
          <p>
            Toda escritura de saldo pasa por el <span className="text-white">webhook de Stripe</span>. Este panel
            nunca modifica el ledger directamente, salvo los reembolsos de leads y contracargos, siempre auditados.
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <AdminHeader user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
