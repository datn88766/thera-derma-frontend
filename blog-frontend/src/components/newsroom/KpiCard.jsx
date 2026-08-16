import React from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

const TONE_STYLES = {
  default: {
    accent: "text-foreground",
    chart: "hsl(var(--chart-2))",
    chartFill: "hsla(213, 43%, 18%, 0.1)",
  },
  accent: {
    accent: "text-accent",
    chart: "hsl(var(--chart-1))",
    chartFill: "hsla(36, 78%, 58%, 0.18)",
  },
  success: {
    accent: "text-emerald-600 dark:text-emerald-400",
    chart: "rgb(16,185,129)",
    chartFill: "rgba(16,185,129,0.18)",
  },
  warning: {
    accent: "text-amber-600 dark:text-amber-300",
    chart: "rgb(245,158,11)",
    chartFill: "rgba(245,158,11,0.2)",
  },
  danger: {
    accent: "text-red-600 dark:text-red-400",
    chart: "rgb(239,68,68)",
    chartFill: "rgba(239,68,68,0.18)",
  },
  info: {
    accent: "text-sky-600 dark:text-sky-400",
    chart: "rgb(14,165,233)",
    chartFill: "rgba(14,165,233,0.18)",
  },
};

function formatNumber(value) {
  if (value === null || value === undefined) return "—";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US").format(value);
}

export default function KpiCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  tone = "default",
  trend,
  onClick,
  loading = false,
}) {
  const palette = TONE_STYLES[tone] || TONE_STYLES.default;
  const trendData =
    Array.isArray(trend) && trend.length > 0
      ? trend.map((point, idx) => ({
          idx,
          v:
            typeof point === "number"
              ? point
              : Number(point?.value ?? point?.count ?? 0),
        }))
      : null;

  const Wrapper = onClick ? "button" : "div";

  const TrendIcon =
    delta == null
      ? Minus
      : delta > 0
        ? ArrowUpRight
        : delta < 0
          ? ArrowDownRight
          : Minus;

  const trendTone =
    delta == null
      ? "text-muted-foreground"
      : delta > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : delta < 0
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground";

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground p-4 text-left",
        "transition-all duration-200 hover:border-foreground/20 hover:shadow-sm",
        onClick ? "cursor-pointer" : "",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground truncate">
            {label}
          </div>
          {loading ? (
            <div className="h-7 w-20 rounded bg-muted animate-pulse" />
          ) : (
            <div
              className={cn(
                "text-2xl font-semibold tabular-nums leading-tight",
                palette.accent,
              )}
            >
              {typeof value === "number" ? formatNumber(value) : (value ?? "—")}
            </div>
          )}
          {hint ? (
            <div className="text-[11px] text-muted-foreground truncate">
              {hint}
            </div>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0",
              palette.accent,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>

      {delta != null || trendData ? (
        <div className="mt-3 flex items-end justify-between gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              trendTone,
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            <span>
              {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}%`}
            </span>
            <span className="text-muted-foreground font-normal">vs last</span>
          </div>
          {trendData ? (
            <div className="h-9 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
                >
                  <defs>
                    <linearGradient
                      id={`kpi-${label}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={palette.chart}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={palette.chart}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={palette.chart}
                    strokeWidth={1.6}
                    fill={`url(#kpi-${label})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      ) : null}
    </Wrapper>
  );
}
