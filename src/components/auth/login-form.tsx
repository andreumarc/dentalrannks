"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/server/actions/onboarding";
import type { AuthActionState } from "@/server/onboarding";

const initialState: AuthActionState = { ok: false };

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/dashboard"} />

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tuclinica@ejemplo.com"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>

      {!state.ok && state.message ? (
        <p role="alert" className="rounded-brand border border-negative/40 bg-negative-tint px-3.5 py-2.5 text-[13.5px] text-negative">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} block size="lg">
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-center text-[13.5px] text-grey">
        ¿Todavía no tienes clínica en DentalRank?{" "}
        <Link href="/alta-clinica" className="font-medium text-cyan-deep hover:text-cyan-brand">
          Da de alta tu clínica
        </Link>
      </p>
    </form>
  );
}
