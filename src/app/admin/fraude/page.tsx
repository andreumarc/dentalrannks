import type { Metadata } from "next";
import Link from "next/link";
import { getFraudSignals } from "@/server/adminOps";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { MarkIpBurstSpamButton, MarkDuplicateBucketButton, SuspendClinicButton } from "@/components/admin/fraud-actions";

export const metadata: Metadata = { title: "Fraude", robots: { index: false, follow: false } };

export default async function AdminFraudPage() {
  const signals = await getFraudSignals();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Fraude</h1>
        <p className="mt-1 text-[14.5px] text-grey">Señales detectadas automáticamente. Cada fila tiene una acción directa.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads duplicados (24 h)</CardTitle>
          <CardDescription>Mismo teléfono en la misma clínica en las últimas 24 horas.</CardDescription>
        </CardHeader>
        <CardContent>
          {signals.duplicateLeads.length === 0 ? (
            <EmptyState title="Sin duplicados" description="No se han detectado duplicados recientes." />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <Tr>
                    <Th>Clínica</Th>
                    <Th>Teléfono</Th>
                    <Th>Repeticiones</Th>
                    <Th>Acción</Th>
                  </Tr>
                </thead>
                <tbody>
                  {signals.duplicateLeads.map((d) => (
                    <Tr key={`${d.clinicId}-${d.phone}`}>
                      <Td className="font-medium text-ink">{d.clinicName}</Td>
                      <Td className="text-[13.5px] text-grey">{d.phone}</Td>
                      <Td>{d.count}</Td>
                      <Td>
                        <MarkDuplicateBucketButton clinicId={d.clinicId} phone={d.phone} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teléfonos con formato inválido (24 h)</CardTitle>
        </CardHeader>
        <CardContent>
          {signals.invalidPhoneLeads.length === 0 ? (
            <EmptyState title="Sin incidencias" description="No se han detectado teléfonos con formato inválido." />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <Tr>
                    <Th>Clínica</Th>
                    <Th>Teléfono</Th>
                    <Th>Fecha</Th>
                    <Th>Acción</Th>
                  </Tr>
                </thead>
                <tbody>
                  {signals.invalidPhoneLeads.map((l) => (
                    <Tr key={l.id}>
                      <Td className="font-medium text-ink">{l.clinicName}</Td>
                      <Td className="text-[13.5px] text-grey">{l.phone}</Td>
                      <Td className="text-[13px] text-grey-light">{l.createdAt.toLocaleString("es-ES")}</Td>
                      <Td>
                        <Link href="/admin/leads" className="text-[13px] font-medium text-cyan-deep hover:text-cyan-brand">
                          Revisar en Leads
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ráfagas desde la misma IP (24 h)</CardTitle>
          <CardDescription>4 o más leads desde el mismo origen en 24 horas.</CardDescription>
        </CardHeader>
        <CardContent>
          {signals.ipBursts.length === 0 ? (
            <EmptyState title="Sin ráfagas" description="No se han detectado ráfagas sospechosas." />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <Tr>
                    <Th>IP (hash)</Th>
                    <Th>Leads</Th>
                    <Th>Clínicas afectadas</Th>
                    <Th>Desde</Th>
                    <Th>Acción</Th>
                  </Tr>
                </thead>
                <tbody>
                  {signals.ipBursts.map((b) => (
                    <Tr key={b.ipHash}>
                      <Td className="font-mono text-[12px] text-grey">{b.ipHash.slice(0, 12)}…</Td>
                      <Td>{b.count}</Td>
                      <Td className="text-[13.5px] text-grey">{b.clinicNames.join(", ")}</Td>
                      <Td className="text-[13px] text-grey-light">{b.since.toLocaleString("es-ES")}</Td>
                      <Td>
                        <MarkIpBurstSpamButton ipHash={b.ipHash} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clics inválidos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {signals.invalidClicks.length === 0 ? (
            <EmptyState title="Sin clics inválidos" description="No hay clics marcados como inválidos en 24 horas." />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <Tr>
                    <Th>Clínica</Th>
                    <Th>Motivo</Th>
                    <Th>Fecha</Th>
                  </Tr>
                </thead>
                <tbody>
                  {signals.invalidClicks.map((c) => (
                    <Tr key={c.id}>
                      <Td className="font-medium text-ink">{c.clinicName}</Td>
                      <Td className="text-[13.5px] text-grey">{c.invalidReason ?? "Sin especificar"}</Td>
                      <Td className="text-[13px] text-grey-light">{c.createdAt.toLocaleString("es-ES")}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clínicas con proporción anómala de leads inválidos (60 días)</CardTitle>
          <CardDescription>Mínimo 10 leads revisados y 40% o más marcados como inválidos, duplicados o spam.</CardDescription>
        </CardHeader>
        <CardContent>
          {signals.anomalousClinics.length === 0 ? (
            <EmptyState title="Sin anomalías" description="Ninguna clínica supera el umbral de leads inválidos." />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <Tr>
                    <Th>Clínica</Th>
                    <Th>Leads revisados</Th>
                    <Th>Leads inválidos</Th>
                    <Th>Proporción</Th>
                    <Th>Acción</Th>
                  </Tr>
                </thead>
                <tbody>
                  {signals.anomalousClinics.map((c) => (
                    <Tr key={c.clinicId}>
                      <Td className="font-medium text-ink">{c.clinicName}</Td>
                      <Td>{c.totalLeads}</Td>
                      <Td>{c.badLeads}</Td>
                      <Td className="text-negative">{c.ratio}%</Td>
                      <Td>
                        <SuspendClinicButton clinicId={c.clinicId} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
