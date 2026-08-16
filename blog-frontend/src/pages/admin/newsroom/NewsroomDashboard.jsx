import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  Newspaper,
  Inbox,
  CheckCircle2,
  CalendarRange,
  Eye,
  Activity,
  ArrowRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Cell,
} from "recharts";

import { newsService } from "@/api/blogService";
import { useNewsroom } from "@/components/newsroom/NewsroomProvider";
import KpiCard from "@/components/newsroom/KpiCard";
import PipelineFlow from "@/components/newsroom/PipelineFlow";

/**
 * @typedef {Object} TrendBucket
 * @property {string} key
 * @property {string} label
 * @property {Date} day
 * @property {number} count
 * @property {number} published
 * @property {number} pending
 * @property {number} drafts
 */

/** @typedef {{ name: string; value: number }} NamedCount */

/**
 * @typedef {Object} NewsItem
 * @property {number | string} id
 * @property {string} [title]
 * @property {string} [slug]
 * @property {string} [created_at]
 * @property {string} [createdAt]
 * @property {string} [status]
 * @property {string} [category]
 * @property {number} [views]
 * @property {string} [source_name]
 * @property {string} [source]
 */

/**
 * @typedef {Object} NewsroomEvent
 * @property {number | string} id
 * @property {string} [severity]
 * @property {string} [action]
 * @property {string} [title]
 * @property {string} [description]
 */

/**
 * @typedef {Object} PipelineStageStat
 * @property {number} [count]
 * @property {string} [hint]
 * @property {"healthy" | "active" | "warning" | "error" | "idle"} [state]
 * @property {number} [warningCount]
 */

/**
 * @typedef {Object} PipelineStage
 * @property {string} key
 * @property {string} label
 * @property {number} count
 * @property {string} [hint]
 * @property {"healthy" | "active" | "warning" | "error" | "idle"} state
 * @property {number} [warningCount]
 */

/** @typedef {{ pending?: number; scheduled?: number; imports?: number }} NewsroomBadges */

/**
 * @typedef {Object} NewsroomStats
 * @property {{ today: number; pending: number; published: number; scheduled: number; drafts: number; archived: number; failed: number; views: number }} [totals]
 * @property {{ daily?: TrendBucket[] }} [trend]
 * @property {NamedCount[]} [byCategory]
 * @property {NamedCount[]} [bySource]
 * @property {{ avgScore?: number } | null} [ai]
 * @property {{ ingest?: PipelineStageStat; normalize?: PipelineStageStat; ai?: PipelineStageStat; translate?: PipelineStageStat }} [pipeline]
 * @property {NewsroomBadges} [badges]
 */

/**
 * @typedef {Object} NewsroomContextValue
 * @property {NewsroomStats | null | undefined} stats
 * @property {NewsroomBadges | undefined} badges
 * @property {() => void} refreshAll
 * @property {NewsroomEvent[] | undefined} events
 * @property {boolean | undefined} eventsLoading
 * @property {() => void} openCommandPalette
 */

/** @param {Date | string | number} date */
function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** @param {number} [rangeDays] */
function buildBuckets(rangeDays = 7) {
  const out = [];
  const today = startOfDay(new Date());
  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    out.push({
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      day,
      count: 0,
      published: 0,
      pending: 0,
      drafts: 0,
    });
  }
  return out;
}

/**
 * @param {{ pending?: number; published?: number; scheduled?: number; draft?: number; archived?: number }} byStatus
 * @param {NewsItem[]} recent
 */
function deriveDashboard(byStatus, recent) {
  const totals = {
    today: 0,
    pending: byStatus.pending ?? 0,
    published: byStatus.published ?? 0,
    scheduled: byStatus.scheduled ?? 0,
    drafts: byStatus.draft ?? 0,
    archived: byStatus.archived ?? 0,
    failed: 0,
    views: 0,
  };

  const buckets = buildBuckets(7);
  const todayKey = startOfDay(new Date()).toISOString().slice(0, 10);
  const recentList = Array.isArray(recent) ? recent : [];

  /** @type {Map<string, number>} */
  const categoryMap = new Map();
  /** @type {Map<string, number>} */
  const sourceMap = new Map();

  for (const article of recentList) {
    const createdRaw = article.created_at || article.createdAt || null;
    const created = createdRaw ? new Date(createdRaw) : null;
    if (!created || Number.isNaN(created.getTime())) continue;
    const key = startOfDay(created).toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) {
      bucket.count += 1;
      if (article.status === "published") bucket.published += 1;
      if (article.status === "pending") bucket.pending += 1;
      if (article.status === "draft") bucket.drafts += 1;
    }
    if (key === todayKey) totals.today += 1;
    totals.views += Number(article.views || 0);

    const cat = String(article.category || "news");
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    const sourceLabel = article.source_name || article.source || "Manual";
    sourceMap.set(sourceLabel, (sourceMap.get(sourceLabel) || 0) + 1);
  }

  /** @type {NamedCount[]} */
  const categories = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  /** @type {NamedCount[]} */
  const sources = Array.from(sourceMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return { totals, buckets, categories, sources };
}

export default function NewsroomDashboard() {
  const navigate = useNavigate();
  /** @type {NewsroomContextValue} */
  const newsroom = useNewsroom();
  const {
    stats,
    badges,
    refreshAll,
    events,
    eventsLoading,
    openCommandPalette,
  } = newsroom;

  const queries = useQueries({
    queries: [
      {
        queryKey: ["dashboard-news-pending"],
        queryFn: () =>
          newsService.listNews({
            lang: "vi",
            auth: true,
            status: "pending",
            page: 1,
            limit: 1,
          }),
        staleTime: 30_000,
      },
      {
        queryKey: ["dashboard-news-published"],
        queryFn: () =>
          newsService.listNews({
            lang: "vi",
            auth: true,
            status: "published",
            page: 1,
            limit: 1,
          }),
        staleTime: 30_000,
      },
      {
        queryKey: ["dashboard-news-scheduled"],
        queryFn: () =>
          newsService.listNews({
            lang: "vi",
            auth: true,
            status: "scheduled",
            page: 1,
            limit: 1,
          }),
        staleTime: 30_000,
      },
      {
        queryKey: ["dashboard-news-draft"],
        queryFn: () =>
          newsService.listNews({
            lang: "vi",
            auth: true,
            status: "draft",
            page: 1,
            limit: 1,
          }),
        staleTime: 30_000,
      },
      {
        queryKey: ["dashboard-news-archived"],
        queryFn: () =>
          newsService.listNews({
            lang: "vi",
            auth: true,
            status: "archived",
            page: 1,
            limit: 1,
          }),
        staleTime: 30_000,
      },
      {
        queryKey: ["dashboard-news-recent"],
        queryFn: () =>
          newsService.listNews({ lang: "vi", auth: true, page: 1, limit: 100 }),
        staleTime: 30_000,
      },
    ],
  });

  const loading = queries.some((q) => q.isLoading);
  const recent = queries[5]?.data?.data ?? [];
  const byStatus = useMemo(
    () => ({
      pending: queries[0]?.data?.total ?? 0,
      published: queries[1]?.data?.total ?? 0,
      scheduled: queries[2]?.data?.total ?? 0,
      draft: queries[3]?.data?.total ?? 0,
      archived: queries[4]?.data?.total ?? 0,
    }),
    [queries],
  );

  const derived = useMemo(
    () => deriveDashboard(byStatus, recent),
    [byStatus, recent],
  );

  // Prefer backend stats (operational mode) if available; otherwise use derived.
  const totals = stats?.totals ?? derived.totals;
  /** @type {TrendBucket[]} */
  const trendBuckets = stats?.trend?.daily ?? derived.buckets;
  /** @type {NamedCount[]} */
  const categories = stats?.byCategory ?? derived.categories;
  /** @type {NamedCount[]} */
  const sources = stats?.bySource ?? derived.sources;
  const aiQuality = stats?.ai ?? null;

  const lastTwo = trendBuckets.slice(-2);
  const previous = lastTwo[0]?.count ?? 0;
  const current = lastTwo[1]?.count ?? totals.today;
  const todayDelta =
    previous === 0
      ? null
      : Math.round(((current - previous) / Math.max(previous, 1)) * 100);

  const trendArr = trendBuckets.map((b) => b.count);
  const publishedArr = trendBuckets.map((b) => b.published);
  const pendingArr = trendBuckets.map((b) => b.pending);
  const draftArr = trendBuckets.map((b) => b.drafts);

  /** @type {PipelineStage[]} */
  const pipelineStages = [
    {
      key: "ingest",
      label: "Ingestion",
      count: stats?.pipeline?.ingest?.count ?? 0,
      hint: stats?.pipeline?.ingest?.hint || "Auto-import from sources",
      state:
        stats?.pipeline?.ingest?.state ||
        (Number(badges?.imports || 0) > 0 ? "active" : "idle"),
      warningCount: stats?.pipeline?.ingest?.warningCount ?? 0,
    },
    {
      key: "normalize",
      label: "Normalize",
      count: stats?.pipeline?.normalize?.count ?? 0,
      hint: "Sanitize, dedupe",
      state: stats?.pipeline?.normalize?.state || "idle",
    },
    {
      key: "ai",
      label: "AI Scoring",
      count: stats?.pipeline?.ai?.count ?? 0,
      hint: aiQuality
        ? `Avg ${Math.round(aiQuality.avgScore || 0)}/100`
        : "Quality, bias, dup",
      state: stats?.pipeline?.ai?.state || "idle",
    },
    {
      key: "review",
      label: "Review queue",
      count: totals.pending,
      hint: totals.pending > 0 ? "Editors waiting" : "Inbox zero",
      state:
        totals.pending > 10
          ? "warning"
          : totals.pending > 0
            ? "active"
            : "healthy",
      warningCount: totals.pending > 25 ? totals.pending - 25 : 0,
    },
    {
      key: "translate",
      label: "Translation",
      count: stats?.pipeline?.translate?.count ?? 0,
      hint: "VI ↔ EN",
      state: stats?.pipeline?.translate?.state || "idle",
    },
    {
      key: "schedule",
      label: "Scheduled",
      count: totals.scheduled,
      hint: totals.scheduled > 0 ? "Queued for publish" : "No queue",
      state: totals.scheduled > 0 ? "active" : "idle",
    },
    {
      key: "publish",
      label: "Published",
      count: totals.published,
      hint: "Live to readers",
      state: "healthy",
    },
  ];

  /** @param {PipelineStage} stage */
  const onStageClick = (stage) => {
    switch (stage.key) {
      case "ingest":
        navigate("/admin/newsroom/ingestion");
        return;
      case "review":
        navigate("/admin/newsroom/review");
        return;
      case "schedule":
        navigate("/admin/newsroom/scheduler");
        return;
      case "publish":
        navigate("/admin/newsroom/articles?status=published");
        return;
      case "translate":
        navigate("/admin/newsroom/translation");
        return;
      default:
        navigate("/admin/newsroom/articles");
    }
  };

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Newsroom Overview
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCommandPalette}
            className="hidden md:inline-flex h-9 px-3 items-center gap-2 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30"
          >
            Command palette
            <kbd className="text-[10px] tracking-wider px-1.5 py-0.5 rounded border border-border">
              Ctrl K
            </kbd>
          </button>
          <button
            type="button"
            onClick={refreshAll}
            className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-xs hover:bg-muted/40"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          label="Articles today"
          value={totals.today}
          delta={todayDelta}
          icon={Newspaper}
          tone="accent"
          trend={trendArr}
          hint="last 7 days"
          loading={loading}
          onClick={() => navigate("/admin/newsroom/articles")}
        />
        <KpiCard
          label="Pending review"
          value={totals.pending}
          delta={null}
          icon={CheckCircle2}
          tone={totals.pending > 0 ? "warning" : "success"}
          trend={pendingArr}
          hint="Click to moderate"
          loading={loading}
          onClick={() => navigate("/admin/newsroom/review")}
        />
        <KpiCard
          label="Published"
          value={totals.published}
          delta={null}
          icon={Activity}
          tone="success"
          trend={publishedArr}
          hint="all time"
          loading={loading}
          onClick={() => navigate("/admin/newsroom/articles?status=published")}
        />
        <KpiCard
          label="Scheduled"
          value={totals.scheduled}
          delta={null}
          icon={CalendarRange}
          tone="info"
          trend={[]}
          hint="upcoming publish"
          loading={loading}
          onClick={() => navigate("/admin/newsroom/scheduler")}
        />
        <KpiCard
          label="Drafts"
          value={totals.drafts}
          delta={null}
          icon={Inbox}
          tone="default"
          trend={draftArr}
          hint="in editorial WIP"
          loading={loading}
          onClick={() => navigate("/admin/newsroom/articles?status=draft")}
        />
        <KpiCard
          label="Total views"
          value={totals.views}
          delta={null}
          icon={Eye}
          tone="accent"
          trend={[]}
          hint="all time"
          loading={loading}
          onClick={undefined}
        />
      </div>

      <PipelineFlow stages={pipelineStages} onStageClick={onStageClick} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Publish velocity</div>
              <div className="text-xs text-muted-foreground">
                Articles created per day, broken down by status
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-3 rounded-sm bg-emerald-500" />{" "}
                Published
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-3 rounded-sm bg-amber-500" /> Pending
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-3 rounded-sm bg-muted-foreground/60" />{" "}
                Drafts
              </span>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendBuckets}
                margin={{ top: 10, right: 12, bottom: 0, left: -12 }}
              >
                <defs>
                  <linearGradient id="grad-pub" x1="0" y1="0" x2="0" y2="1">
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
                  <linearGradient id="grad-pend" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="rgb(245,158,11)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="rgb(245,158,11)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id="grad-draft" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(var(--muted-foreground))"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--muted-foreground))"
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
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
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
                  dataKey="published"
                  stroke="rgb(16,185,129)"
                  fill="url(#grad-pub)"
                  strokeWidth={1.6}
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stroke="rgb(245,158,11)"
                  fill="url(#grad-pend)"
                  strokeWidth={1.6}
                />
                <Area
                  type="monotone"
                  dataKey="drafts"
                  stroke="hsl(var(--muted-foreground))"
                  fill="url(#grad-draft)"
                  strokeWidth={1.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Top categories</div>
              <div className="text-xs text-muted-foreground">
                recent 100 articles
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/newsroom/analytics")}
              className="text-xs text-accent hover:underline inline-flex items-center gap-1"
            >
              Analytics <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categories}
                layout="vertical"
                margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {categories.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={
                        [
                          "hsl(var(--chart-1))",
                          "hsl(var(--chart-2))",
                          "hsl(var(--chart-3))",
                          "hsl(var(--chart-4))",
                          "hsl(var(--chart-5))",
                          "hsl(var(--chart-1))",
                        ][idx % 6]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <RecentArticlesCard
          articles={recent.slice(0, 6)}
          onOpen={(item) => navigate(`/admin/news/create?id=${item.id}`)}
          onView={(item) => navigate(`/${item.slug}`)}
          onAll={() => navigate("/admin/newsroom/articles")}
          loading={loading}
        />
        <SourcesCard
          sources={sources}
          onAll={() => navigate("/admin/newsroom/sources")}
        />
        <RealtimeNudgeCard
          events={events}
          loading={eventsLoading ?? false}
          onAll={() => navigate("/admin/newsroom/logs")}
        />
      </div>
    </div>
  );
}

/**
 * @param {{
 *  articles?: NewsItem[];
 *  onOpen: (item: NewsItem) => void;
 *  onView: (item: NewsItem) => void;
 *  onAll: () => void;
 *  loading: boolean;
 * }} props
 */
function RecentArticlesCard({ articles = [], onOpen, onView, onAll, loading }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">Recent articles</div>
          <div className="text-xs text-muted-foreground">
            latest editorial activity
          </div>
        </div>
        <button
          type="button"
          onClick={onAll}
          className="text-xs text-accent hover:underline inline-flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      {loading && articles.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-12 rounded-lg bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-xs text-muted-foreground py-8 text-center">
          No articles yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {articles.map((item) => {
            const created = item.created_at ? new Date(item.created_at) : null;
            const status = String(item.status || "draft");
            const statusKey = Object.prototype.hasOwnProperty.call(
              STATUS_TONE,
              status,
            )
              ? /** @type {keyof typeof STATUS_TONE} */ (status)
              : "draft";
            const statusTone = STATUS_TONE[statusKey];
            return (
              <li key={item.id} className="py-2.5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onOpen(item)}
                      className="text-sm font-medium hover:text-accent text-left line-clamp-2"
                    >
                      {item.title}
                    </button>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span
                        className={`px-1.5 py-0.5 rounded uppercase tracking-wider ${statusTone}`}
                      >
                        {status}
                      </span>
                      <span>{item.category || "news"}</span>
                      {created ? (
                        <span>
                          •{" "}
                          {created.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ) : null}
                      {item.views ? <span>• {item.views} views</span> : null}
                    </div>
                  </div>
                  {item.slug ? (
                    <button
                      type="button"
                      onClick={() => onView(item)}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      View
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const STATUS_TONE = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  archived: "bg-muted text-muted-foreground",
};

/**
 * @param {{ sources?: NamedCount[]; onAll: () => void }} props
 */
function SourcesCard({ sources = [], onAll }) {
  const max = Math.max(...sources.map((s) => s.value), 1);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">Top sources</div>
          <div className="text-xs text-muted-foreground">
            contributing recent articles
          </div>
        </div>
        <button
          type="button"
          onClick={onAll}
          className="text-xs text-accent hover:underline inline-flex items-center gap-1"
        >
          Explore <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      {sources.length === 0 ? (
        <div className="text-xs text-muted-foreground py-8 text-center">
          Connect an RSS / API source to see contributions here.
        </div>
      ) : (
        <ul className="space-y-3">
          {sources.map((source) => (
            <li key={source.name}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate">{source.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {source.value}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${Math.max(6, Math.round((source.value / max) * 100))}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * @param {{ events?: NewsroomEvent[]; loading: boolean; onAll: () => void }} props
 */
function RealtimeNudgeCard({ events, loading, onAll }) {
  const lastEvent = events?.[0];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">Realtime ops</div>
          <div className="text-xs text-muted-foreground">
            last events on the pipeline
          </div>
        </div>
        <button
          type="button"
          onClick={onAll}
          className="text-xs text-accent hover:underline inline-flex items-center gap-1"
        >
          Open logs <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      {loading && !lastEvent ? (
        <div className="h-12 rounded-md bg-muted/50 animate-pulse" />
      ) : !lastEvent ? (
        <div className="text-xs text-muted-foreground py-8 text-center">
          Pipeline idle. Events will stream here when ingestion or moderation
          actions occur.
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          {(events || []).slice(0, 4).map((event) => (
            <div
              key={event.id}
              className="rounded-md border border-border bg-background/60 p-2.5"
            >
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="uppercase tracking-wider">
                  {event.severity || "info"}
                </span>
                <span>{event.action}</span>
              </div>
              <div className="text-sm font-medium leading-tight mt-0.5 line-clamp-2">
                {event.title || event.action}
              </div>
              {event.description ? (
                <div className="text-[11px] text-muted-foreground line-clamp-2">
                  {event.description}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
