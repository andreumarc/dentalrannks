"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportLeadsCsvAction } from "@/server/actions/crm";
import type { LeadFilters } from "@/server/crm";

export function ExportCsvButton({
  clinicId,
  clinicName,
  filters,
}: {
  clinicId: string;
  clinicName: string;
  filters: LeadFilters;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    startTransition(async () => {
      const result = await exportLeadsCsvAction(clinicId, clinicName, filters);
      if (!result.ok || !result.csv) {
        setError(result.message ?? "No se pudo generar el archivo.");
        return;
      }
      const blob = new Blob([`﻿${result.csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${clinicName.replace(/\s+/g, "-").toLowerCase()}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={pending}>
        <Download className="size-4" />
        {pending ? "Generando…" : "Exportar CSV"}
      </Button>
      {error ? <p className="text-[12.5px] text-negative">{error}</p> : null}
    </div>
  );
}
