"use client";

import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

export function ScoreRing({ value, label }: { value: number; label?: string }) {
  const color = value >= 75 ? "var(--success)" : value >= 50 ? "var(--warning)" : "var(--destructive)";
  const config = { score: { label: label ?? "Score", color } } satisfies ChartConfig;

  return (
    <div className="flex flex-col items-center gap-1">
      <ChartContainer config={config} className="aspect-square size-24">
        <RadialBarChart data={[{ score: value }]} innerRadius={34} outerRadius={46} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="score" fill="var(--color-score)" background cornerRadius={8} />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox ? (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-lg font-semibold"
                  >
                    {value}
                  </text>
                ) : null
              }
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
