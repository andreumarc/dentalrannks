import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CsvImportPanel } from "@/components/admin/csv-import-panel";

export const metadata: Metadata = { title: "Importación", robots: { index: false, follow: false } };

export default function AdminImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Importación de clínicas</h1>
        <p className="mt-1 text-[14.5px] text-grey">
          Importa clínicas en bloque desde un CSV. Cada fila crea una organización, una clínica en borrador y su
          saldo a cero.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cargar CSV</CardTitle>
          <CardDescription>El análisis se hace en el servidor, sin dependencias externas.</CardDescription>
        </CardHeader>
        <CardContent>
          <CsvImportPanel />
        </CardContent>
      </Card>
    </div>
  );
}
