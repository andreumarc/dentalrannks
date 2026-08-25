"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export type TrendPoint = { date: string; leads: number; clicks: number; spendCents: number };

function formatDay(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const formatted = data.map((d) => ({ ...d, label: formatDay(d.date), spendEuros: d.spendCents / 100 }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#01ADD0" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#01ADD0" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8EA" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6B7478" }}
            axisLine={{ stroke: "#E2E8EA" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#6B7478" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 6,
              border: "1px solid #E2E8EA",
              fontSize: 13,
              fontFamily: "var(--font-sans)",
            }}
            formatter={(value, name) => {
              if (name === "leads") return [value, "Leads"];
              if (name === "clicks") return [value, "Clics"];
              return [value, name];
            }}
            labelFormatter={(label) => `Día ${label}`}
          />
          <Area type="monotone" dataKey="leads" stroke="#01ADD0" strokeWidth={2} fill="url(#leadsFill)" />
          <Area type="monotone" dataKey="clicks" stroke="#393F42" strokeWidth={1.5} fillOpacity={0} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
