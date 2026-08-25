"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

type CookieChoice = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
};

const STORAGE_KEY = "dentalrank-cookie-consent";

function readChoice(): CookieChoice | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieChoice;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function saveChoice(choice: Omit<CookieChoice, "savedAt">) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...choice, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Si el almacenamiento no está disponible, no bloqueamos la navegación:
    // simplemente volveremos a preguntar en la siguiente visita.
  }
}

/**
 * Aviso de cookies granular. Denegado por defecto: mientras no haya elección
 * guardada, solo se consideran activas las cookies técnicas imprescindibles.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setVisible(readChoice() === null);
  }, []);

  if (!visible) return null;

  function acceptAll() {
    saveChoice({ necessary: true, analytics: true, marketing: true });
    setVisible(false);
  }

  function rejectNonEssential() {
    saveChoice({ necessary: true, analytics: false, marketing: false });
    setVisible(false);
  }

  function savePreferences() {
    saveChoice({ necessary: true, analytics, marketing });
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-line bg-white p-4 shadow-drop sm:p-5"
    >
      <div className="wrap-wide flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 size-5 shrink-0 text-cyan-brand" aria-hidden="true" />
          <div>
            <p className="text-[14.5px] leading-relaxed text-ink">
              Usamos cookies técnicas imprescindibles para el funcionamiento del sitio. Con tu
              permiso, también nos gustaría usar cookies analíticas y de marketing. Puedes
              cambiar tu elección cuando quieras.{" "}
              <Link href="/legal/cookies" className="underline hover:text-cyan-deep">
                Más información
              </Link>
              .
            </p>

            {expanded ? (
              <fieldset className="mt-4 grid gap-2.5 sm:grid-cols-3">
                <legend className="sr-only">Tipos de cookies</legend>
                <label className="flex items-center gap-2 rounded-brand border border-line bg-mist px-3 py-2 text-[13px] text-grey">
                  <input type="checkbox" checked disabled className="size-4" />
                  Necesarias (siempre activas)
                </label>
                <label className="flex items-center gap-2 rounded-brand border border-line px-3 py-2 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="size-4"
                  />
                  Analíticas
                </label>
                <label className="flex items-center gap-2 rounded-brand border border-line px-3 py-2 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="size-4"
                  />
                  Marketing
                </label>
              </fieldset>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2.5">
          {expanded ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(false)}>
              Atrás
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(true)}>
              Personalizar
            </Button>
          )}
          <Button type="button" variant="dark" size="sm" onClick={rejectNonEssential}>
            Rechazar no esenciales
          </Button>
          {expanded ? (
            <Button type="button" size="sm" onClick={savePreferences}>
              Guardar preferencias
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={acceptAll}>
              Aceptar todo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
