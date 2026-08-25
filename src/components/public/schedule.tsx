import { Clock } from "lucide-react";

const DAY_LABELS: { key: string; label: string }[] = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

type Ranges = [string, string][];

/** El horario se guarda como JSON libre: { mon: [["09:00","14:00"]], ... }. Se valida en tiempo de lectura. */
function parseSchedule(json: unknown): Record<string, Ranges> | null {
  if (!json || typeof json !== "object") return null;
  const out: Record<string, Ranges> = {};
  for (const { key } of DAY_LABELS) {
    const value = (json as Record<string, unknown>)[key];
    if (!Array.isArray(value)) continue;
    const ranges: Ranges = [];
    for (const range of value) {
      if (Array.isArray(range) && typeof range[0] === "string" && typeof range[1] === "string") {
        ranges.push([range[0], range[1]]);
      }
    }
    if (ranges.length > 0) out[key] = ranges;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function ScheduleList({ scheduleJson }: { scheduleJson: unknown }) {
  const schedule = parseSchedule(scheduleJson);
  if (!schedule) return null;

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 font-display text-[15px] font-semibold uppercase tracking-[0.03em] text-ink">
        <Clock className="size-4 text-cyan-brand" aria-hidden="true" />
        Horario
      </h3>
      <dl className="divide-y divide-line text-[14px]">
        {DAY_LABELS.map(({ key, label }) => {
          const ranges = schedule[key];
          return (
            <div key={key} className="flex items-center justify-between py-2">
              <dt className="text-grey">{label}</dt>
              <dd className="text-ink">
                {ranges ? ranges.map((r) => `${r[0]}–${r[1]}`).join(", ") : "Cerrado"}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/** Formato openingHoursSpecification apto para JSON-LD. */
export function scheduleToOpeningHours(scheduleJson: unknown) {
  const schedule = parseSchedule(scheduleJson);
  if (!schedule) return undefined;
  const dayMap: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };
  const spec: { "@type": string; dayOfWeek: string; opens: string; closes: string }[] = [];
  for (const [key, ranges] of Object.entries(schedule)) {
    for (const [opens, closes] of ranges) {
      spec.push({ "@type": "OpeningHoursSpecification", dayOfWeek: dayMap[key], opens, closes });
    }
  }
  return spec.length > 0 ? spec : undefined;
}
