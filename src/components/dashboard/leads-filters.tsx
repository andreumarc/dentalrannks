import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LEAD_STATUS_OPTIONS } from "@/components/dashboard/status-badge";

export function LeadsFilters({
  clinicId,
  treatments,
  current,
}: {
  clinicId: string;
  treatments: { id: string; name: string }[];
  current: { status?: string; treatmentId?: string; from?: string; to?: string; q?: string };
}) {
  return (
    <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <input type="hidden" name="clinic" value={clinicId} />

      <div className="col-span-2 sm:col-span-1">
        <Label htmlFor="q">Buscar</Label>
        <Input id="q" name="q" placeholder="Nombre, teléfono, email" defaultValue={current.q ?? ""} />
      </div>

      <div>
        <Label htmlFor="status">Estado</Label>
        <Select id="status" name="status" defaultValue={current.status ?? ""}>
          <option value="">Todos</option>
          {LEAD_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="treatmentId">Tratamiento</Label>
        <Select id="treatmentId" name="treatmentId" defaultValue={current.treatmentId ?? ""}>
          <option value="">Todos</option>
          {treatments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="from">Desde</Label>
        <Input id="from" name="from" type="date" defaultValue={current.from ?? ""} />
      </div>

      <div>
        <Label htmlFor="to">Hasta</Label>
        <Input id="to" name="to" type="date" defaultValue={current.to ?? ""} />
      </div>

      <div className="flex items-end">
        <Button type="submit" variant="dark" block>
          Filtrar
        </Button>
      </div>
    </form>
  );
}
