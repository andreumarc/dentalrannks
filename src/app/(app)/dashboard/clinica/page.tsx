import { requireActiveClinic, getClinicProfileData } from "@/server/dashboard";
import { NoClinicsState } from "@/components/dashboard/no-clinics";
import { ClinicProfileForm } from "@/components/dashboard/clinic-profile-form";
import { ClinicTreatmentsForm } from "@/components/dashboard/clinic-treatments-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";

export default async function ClinicaPage({
  searchParams,
}: {
  searchParams: Promise<{ clinic?: string }>;
}) {
  const sp = await searchParams;
  const { active } = await requireActiveClinic(sp.clinic);
  if (!active) return <NoClinicsState />;

  const { clinic, treatments, allTreatments } = await getClinicProfileData(active.clinic.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display-h3 text-ink">Mi clínica</h1>
          <p className="mt-1 text-[14.5px] text-grey">Perfil público visible en el marketplace.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={clinic.profileCompleteness >= 80 ? "positive" : clinic.profileCompleteness >= 40 ? "warning" : "negative"}>
            Ficha completa al {clinic.profileCompleteness}%
          </Badge>
          <Badge variant="outline">{clinic.status}</Badge>
        </div>
      </div>

      <InfoNote tone="cyan">
        El <strong>DentalRank Score</strong> ({clinic.dentalRankScore}/100) es una señal editorial y de datos. Nunca
        depende del dinero invertido en patrocinio ni de las pujas de esta sección.
      </InfoNote>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la ficha</CardTitle>
          <CardDescription>Estos datos se muestran en tu página pública del marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicProfileForm
            clinic={{
              id: clinic.id,
              name: clinic.name,
              tagline: clinic.tagline,
              description: clinic.description,
              phone: clinic.phone,
              whatsapp: clinic.whatsapp,
              email: clinic.email,
              website: clinic.website,
              address: clinic.address,
              postalCode: clinic.postalCode,
              firstVisitFree: clinic.firstVisitFree,
              financing: clinic.financing,
              emergency24h: clinic.emergency24h,
              parking: clinic.parking,
              accessible: clinic.accessible,
              languages: clinic.languages,
              diagnostics: clinic.diagnostics,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tratamientos y precios</CardTitle>
          <CardDescription>Marca los tratamientos que ofreces e indica un precio «desde» orientativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicTreatmentsForm
            clinicId={active.clinic.id}
            allTreatments={allTreatments}
            clinicTreatments={treatments.map((t) => ({ treatmentId: t.treatmentId, priceFromCents: t.priceFromCents }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
