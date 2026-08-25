import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OrgRole } from "@prisma/client";

export class AuthorizationError extends Error {
  constructor(message = "No autorizado") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "SUPER_ADMIN" | "USER";
};

export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    role: session.user.role ?? "USER",
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");
  return user;
}

export type Membership = {
  organizationId: string;
  organizationName: string;
  role: OrgRole;
};

/** Organizaciones a las que pertenece el usuario. */
export const membershipsOf = cache(async (userId: string): Promise<Membership[]> => {
  const rows = await prisma.organizationUser.findMany({
    where: { userId },
    include: { organization: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    organizationId: r.organizationId,
    organizationName: r.organization.name,
    role: r.role,
  }));
});

/** Ids de clínicas que el usuario puede ver. Un SUPER_ADMIN las ve todas. */
export const accessibleClinicIds = cache(async (user: SessionUser): Promise<string[] | "ALL"> => {
  if (user.role === "SUPER_ADMIN") return "ALL";
  const memberships = await membershipsOf(user.id);
  if (memberships.length === 0) return [];
  const clinics = await prisma.clinic.findMany({
    where: { organizationId: { in: memberships.map((m) => m.organizationId) } },
    select: { id: true },
  });
  return clinics.map((c) => c.id);
});

/**
 * Comprobación de autorización a nivel de servidor. Toda lectura o escritura
 * sobre una clínica pasa por aquí; nunca se confía en el identificador del cliente.
 */
export async function assertClinicAccess(
  user: SessionUser,
  clinicId: string,
  opts: { requireAdmin?: boolean } = {},
): Promise<void> {
  if (user.role === "SUPER_ADMIN") return;

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { organizationId: true },
  });
  if (!clinic) throw new AuthorizationError("Clínica no encontrada");

  const membership = await prisma.organizationUser.findUnique({
    where: {
      organizationId_userId: { organizationId: clinic.organizationId, userId: user.id },
    },
  });
  if (!membership) throw new AuthorizationError();
  if (opts.requireAdmin && membership.role !== "CLINIC_ADMIN") {
    throw new AuthorizationError("Se requiere rol de administrador de la clínica");
  }
}

export async function assertOrgAccess(
  user: SessionUser,
  organizationId: string,
  opts: { requireAdmin?: boolean } = {},
): Promise<void> {
  if (user.role === "SUPER_ADMIN") return;
  const membership = await prisma.organizationUser.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!membership) throw new AuthorizationError();
  if (opts.requireAdmin && membership.role !== "CLINIC_ADMIN") {
    throw new AuthorizationError("Se requiere rol de administrador");
  }
}
