import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { TrendingUp, Eye, Users, FileText } from "lucide-react";

import { newsService } from "@/api/blogService";
import { newsroomService } from "@/api/blogNewsroomService";
import KpiCard from "@/components/newsroom/KpiCard";

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function build30Days() {
  const out = [];
  const today = startOfDay(new Date());
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    out.push({
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      published: 0,
      total: 0,
      views: 0,
    });
  }
  return out;
}

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function NewsroomAnalytics() {
  const opsQuery = useQuery({
    queryKey: ["analytics-operational"],
    queryFn: async () => {
      try {
        const res = await newsroomService.getAnalytics({ rangeDays: 30 });
        return res.data || null;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-articles"],
    queryFn: () =>
      newsService.listNews({ lang: "vi", auth: true, page: 1, limit: 200 }),
    staleTime: 60_000,
  });

  const articles = data?.data ?? [];

  const derived = useMemo(() => {
    const buckets = build30Days();
    const byCategory = new Map();
    const byAuthor = new Map();
    let totalViews = 0;
    let publishedTotal = 0;

    for (const a of articles) {
      const date = new Date(a.created_at);
      if (!Number.isNaN(date.getTime())) {
        const key = startOfDay(date).toISOString().slice(0, 10);
        const bucket = buckets.find((b) => b.key === key);
        if (bucket) {
          bucket.total += 1;
          if (a.status === "published") bucket.published += 1;
          bucket.views += Number(a.views || 0);
        }
      }
      const cat = a.category || "news";
      byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
      const author = `Author #${a.author_id}`;
      byAuthor.set(author, (byAuthor.get(author) || 0) + 1);
      totalViews += Number(a.views || 0);
      if (a.status === "published") publishedTotal += 1;
    }

    const categoryRows = Array.from(byCategory.entries()).map(
      ([name, value]) => ({ name, value }),
    );
    const authorRows = Array.from(byAuthor.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      buckets,
      categoryRows,
      authorRows,
      totalViews,
      publishedTotal,
      totalArticles: articles.length,
      avgViews:
        publishedTotal === 0 ? 0 : Math.round(totalViews / publishedTotal),
    };
  }, [articles]);

  const ops = opsQuery.data;

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Editorial analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            {ops
              ? "Backend operational metrics"
              : "Derived from recent articles (operational endpoint not enabled)"}
          </p>
        </div>
        {ops ? (
          <div className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full">
            Live operational data
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total views"
          value={derived.totalViews}
          icon={Eye}
          tone="accent"
          loading={isLoading}
        />
        <KpiCard
          label="Published"
          value={derived.publishedTotal}
          icon={TrendingUp}
          tone="success"
          loading={isLoading}
        />
        <KpiCard
          label="Avg views / article"
          value={derived.avgViews}
          icon={FileText}
          tone="info"
          loading={isLoading}
        />
        <KpiCard
          label="Active authors"
          value={derived.authorRows.length}
          icon={Users}
          tone="default"
          loading={isLoading}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold">
              Publish velocity (30 days)
            </div>
            <div className="text-xs text-muted-foreground">
              Total articles vs published
            </div>
          </div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={derived.buckets}
              margin={{ top: 10, right: 12, bottom: 0, left: -12 }}
            >
              <defs>
                <linearGradient id="ana-total" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--chart-2))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--chart-2))"
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient id="ana-pub" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="rgb(16,185,129)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(16,185,129)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--chart-2))"
                fill="url(#ana-total)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="published"
                stroke="rgb(16,185,129)"
                fill="url(#ana-pub)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold mb-3">Articles by category</div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={derived.categoryRows}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {derived.categoryRows.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {derived.categoryRows.map((row, idx) => (
              <li key={row.name} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="font-medium">{row.name}</span>
                <span className="text-muted-foreground tabular-nums ml-auto">
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold mb-3">Top authors</div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={derived.authorRows}
                layout="vertical"
                margin={{ top: 4, right: 12, bottom: 4, left: 12 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  fill="hsl(var(--chart-1))"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
