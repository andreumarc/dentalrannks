"use client";

import { useActionState, useRef, useState } from "react";
import { Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoNote } from "@/components/ui/states";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { previewCsvImportAction, confirmCsvImportAction } from "@/server/actions/adminOps";
import type { CsvPreviewState, CsvImportState } from "@/server/adminOps";

const previewInitial: CsvPreviewState = { ok: false, rows: [] };
const importInitial: CsvImportState = { ok: false, created: 0, skipped: 0, errors: [] };

export function CsvImportPanel() {
  const [csvText, setCsvText] = useState("");
  const [previewState, previewAction, previewPending] = useActionState(previewCsvImportAction, previewInitial);
  const [importState, importAction, importPending] = useActionState(confirmCsvImportAction, importInitial);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  const validCount = previewState.rows.filter((r) => r.errors.length === 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Label htmlFor="csv-file">Subir archivo CSV</Label>
        <input
          ref={fileInputRef}
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="block text-[13.5px] text-grey file:mr-3 file:rounded-brand file:border-0 file:bg-anthracite file:px-3.5 file:py-2 file:font-display file:text-[12px] file:font-semibold file:uppercase file:tracking-[0.06em] file:text-white"
        />
      </div>

      <div>
        <Label htmlFor="csv-text">O pega el CSV directamente</Label>
        <p className="mb-2 text-[12.5px] text-grey-light">
          Columnas requeridas: name, website, address, postal_code, city, province, phone, lat, lng
        </p>
        <Textarea
          id="csv-text"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={8}
          placeholder="name,website,address,postal_code,city,province,phone,lat,lng"
          className="font-mono text-[12.5px]"
        />
      </div>

      <form action={previewAction}>
        <input type="hidden" name="csv" value={csvText} />
        <Button type="submit" variant="outline" disabled={previewPending || !csvText.trim()}>
          {previewPending ? "Analizando…" : "Analizar CSV"}
        </Button>
      </form>

      {!previewState.ok && previewState.message ? <InfoNote tone="warning">{previewState.message}</InfoNote> : null}

      {previewState.ok && previewState.rows.length > 0 ? (
        <div className="flex flex-col gap-4">
          <InfoNote tone="cyan">
            {previewState.message} Solo se importarán las filas sin errores.
          </InfoNote>

          <TableWrap>
            <Table>
              <thead>
                <Tr>
                  <Th>Fila</Th>
                  <Th>Nombre</Th>
                  <Th>Municipio</Th>
                  <Th>Estado</Th>
                  <Th>Errores</Th>
                </Tr>
              </thead>
              <tbody>
                {previewState.rows.map((r) => (
                  <Tr key={r.rowNumber}>
                    <Td className="text-[13px] text-grey-light">{r.rowNumber}</Td>
                    <Td className="text-[13.5px] text-ink">{r.data?.name ?? "—"}</Td>
                    <Td className="text-[13.5px] text-grey">{r.data?.city ?? "—"}</Td>
                    <Td>
                      <Badge variant={r.errors.length === 0 ? "positive" : "negative"} size="sm">
                        {r.errors.length === 0 ? "Válida" : "Con errores"}
                      </Badge>
                    </Td>
                    <Td className="text-[12.5px] text-negative">{r.errors.join(" ")}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>

          <form action={importAction}>
            <input type="hidden" name="csv" value={csvText} />
            <Button type="submit" disabled={importPending || validCount === 0}>
              {importPending ? "Importando…" : `Confirmar importación de ${validCount} clínicas`}
            </Button>
          </form>
        </div>
      ) : null}

      {importState.ok && importState.message ? (
        <InfoNote tone="cyan">
          {importState.message}
          {importState.errors.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-[12.5px] text-negative">
              {importState.errors.slice(0, 20).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ) : null}
        </InfoNote>
      ) : null}
    </div>
  );
}
