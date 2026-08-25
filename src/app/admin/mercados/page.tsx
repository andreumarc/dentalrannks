import type { Metadata } from "next";
import { getMarketsPage, getMarketFormOptions } from "@/server/adminOps";
import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/dashboard/pagination";
import { MarketCreateForm } from "@/components/admin/market-create-form";
import { MarketStatusControl, MarketParamsControl } from "@/components/admin/market-row-controls";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Mercados", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, string> = { ACTIVE: "Activo", PAUSED: "Pausado", CLOSED: "Cerrado" };
const STATUS_VARIANT: Record<string, "positive" | "warning" | "neutral"> = {
  ACTIVE: "positive",
  PAUSED: "warning",
  CLOSED: "neutral",
};
const PRICING_LABEL: Record<string, string> = { BALANCE: "Saldo comprometido", CPC: "Coste por clic", CPL: "Coste por lead" };

export default async function AdminMarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters = { status: sp.status || undefined, q: sp.q || undefined, page: Math.max(1, Number(sp.page) || 1) };

  const [{ rows, total, page, pageSize }, options] = await Promise.all([
    getMarketsPage(filters),
    getMarketFormOptions(),
  ]);

  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    params.set("page", String(targetPage));
    return `/admin/mercados?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Mercados</h1>
        <p className="mt-1 text-[14.5px] text-grey">{total} mercados de tratamiento × municipio.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear mercado</CardTitle>
          <CardDescription>Un mercado por combinación de tratamiento y municipio.</CardDescription>
        </CardHeader>
        <CardContent>
          <MarketCreateForm treatments={options.treatments} cities={options.cities} />
        </CardContent>
      </Card>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Label htmlFor="q">Buscar</Label>
          <Input id="q" name="q" placeholder="Tratamiento o municipio" defaultValue={filters.q ?? ""} />
        </div>
        <div>
          <Label htmlFor="status">Estado</Label>
          <Select id="status" name="status" defaultValue={filters.status ?? ""}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="dark">
          Filtrar
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Sin mercados" description="Todavía no hay mercados que coincidan con los filtros." />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Tratamiento</Th>
                <Th>Municipio</Th>
                <Th>Modelo</Th>
                <Th>Estado</Th>
                <Th>Pujas</Th>
                <Th className="min-w-[320px]">Parámetros</Th>
              </Tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <Tr key={m.id}>
                  <Td className="font-medium text-ink">{m.treatment.name}</Td>
                  <Td className="text-[13.5px] text-grey">{m.city.name}</Td>
                  <Td className="text-[13.5px] text-grey">{PRICING_LABEL[m.pricingModel]}</Td>
                  <Td>
                    <div className="flex flex-col gap-1.5">
                      <Badge variant={STATUS_VARIANT[m.status]} size="sm">
                        {STATUS_LABEL[m.status]}
                      </Badge>
                      <MarketStatusControl marketId={m.id} currentStatus={m.status} />
                    </div>
                  </Td>
                  <Td>{m._count.bids}</Td>
                  <Td>
                    <p className="mb-1.5 text-[12px] text-grey-light">
                      Mín. {formatCents(m.minimumBidCents)} · Incr. {formatCents(m.bidIncrementCents)} · {m.sponsoredSlots} posiciones
                    </p>
                    <MarketParamsControl
                      marketId={m.id}
                      minimumBidCents={m.minimumBidCents}
                      bidIncrementCents={m.bidIncrementCents}
                      sponsoredSlots={m.sponsoredSlots}
                      pricingModel={m.pricingModel}
                    />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} makeHref={makeHref} />
    </div>
  );
}
