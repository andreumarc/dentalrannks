import { requireActiveClinic, getTeamData } from "@/server/dashboard";
import { NoClinicsState } from "@/components/dashboard/no-clinics";
import { TeamTable } from "@/components/dashboard/team-table";
import { InviteForm } from "@/components/dashboard/invite-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/states";

export default async function EquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ clinic?: string }>;
}) {
  const sp = await searchParams;
  const { user, active } = await requireActiveClinic(sp.clinic);
  if (!active) return <NoClinicsState />;

  const { members, invitations } = await getTeamData(user, active.clinic.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Equipo</h1>
        <p className="mt-1 text-[14.5px] text-grey">Personas con acceso a {active.clinic.organizationName}.</p>
      </div>

      {active.isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Invitar a alguien</CardTitle>
            <CardDescription>Se creará una invitación pendiente. El envío de email todavía no está conectado.</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm organizationId={active.clinic.organizationId} />
          </CardContent>
        </Card>
      ) : (
        <InfoNote>Solo los administradores de la organización pueden invitar nuevos miembros.</InfoNote>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Miembros</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamTable members={members} invitations={invitations} />
        </CardContent>
      </Card>
    </div>
  );
}
