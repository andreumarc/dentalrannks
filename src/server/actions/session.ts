"use server";

import { signOut } from "@/lib/auth";

/** Cierre de sesión. Vive en su propio módulo "use server" para poder
 *  invocarse desde componentes de cliente. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
