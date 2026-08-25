"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { BreakdownRow } from "@/server/dashboard";

export function BreakdownChart({ rows }: { rows: BreakdownRow[] }) {
  const data = rows.slice(0, 8).map((r) => ({ name: r.name, Gasto: r.spendCents / 100 }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8EA" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7478" }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 11.5, fill: "#22272A" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 6, border: "1px solid #E2E8EA", fontSize: 13 }}
            formatter={(value) => [`${Number(value ?? 0).toFixed(2)} €`, "Gasto"]}
          />
          <Bar dataKey="Gasto" fill="#01ADD0" radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
