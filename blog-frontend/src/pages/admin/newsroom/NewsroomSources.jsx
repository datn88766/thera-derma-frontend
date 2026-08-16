import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Rss,
  Plus,
  RefreshCw,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Edit,
} from "lucide-react";

import { newsroomService } from "@/api/blogNewsroomService";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

const HEALTH_STATES = {
  healthy: {
    icon: CheckCircle2,
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  degraded: {
    icon: AlertTriangle,
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  failing: {
    icon: XCircle,
    badge: "bg-red-500/15 text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
  paused: {
    icon: Loader2,
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
};

export default function NewsroomSources() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [crawlResult, setCrawlResult] = useState(null);
  const [crawling, setCrawling] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["newsroom-sources"],
    queryFn: async () => {
      try {
        const res = await newsroomService.listSources();
        return res.data || [];
      } catch (err) {
        const message = err?.message || "";
        if (/404/.test(message) || /Not Found/i.test(message)) {
          return null;
        }
        throw err;
      }
    },
  });

  const sources = Array.isArray(data) ? data : [];
  const operational = data !== null;
  const enabledCount = sources.filter((source) => source.enabled).length;

  return (
    <div className="px-4 lg:px-6 py-6 space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">News sources</h2>
          <p className="text-sm text-muted-foreground">
            RSS, API and scraper sources feeding the ingestion pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (sources.length === 0) {
                notify.warning({
                  title: "No sources configured",
                  description: "Seed nguồn Thera Derma trước, sau đó test và bật ít nhất một nguồn.",
                });
                return;
              }
              if (enabledCount === 0) {
                notify.warning({
                  title: "No enabled sources",
                  description: "Enable at least one tested source before running Crawl & Translate News.",
                });
                return;
              }
              try {
                setCrawling(true);
                const res = await newsroomService.crawlTranslateAll();
                setCrawlResult(res.data);
                if ((res.data?.scannedSources || 0) === 0) {
                  notify.warning({
                    title: "Crawl skipped",
                    description: res.data?.message || "No enabled sources were found.",
                  });
                } else if (res.data?.status === "failed") {
                  notify.error({
                    title: "Crawl failed",
                    description: res.data?.failedCount
                      ? `${res.data.failedCount} items failed. Check Import logs for details.`
                      : "No articles imported. Check Import logs for details.",
                  });
                } else if (res.data?.status === "partial_failed") {
                  notify.warning({
                    title: "Crawl completed with warnings",
                    description: `${res.data?.importedCount || 0} imported, ${res.data?.failedCount || 0} failed.`,
                  });
                } else if (
                  (res.data?.importedCount || 0) === 0 &&
                  res.data?.stoppedAtDuplicateLatest
                ) {
                  notify.warning({
                    title: "Không có bài mới",
                    description:
                      res.data?.message ||
                      "Bài mới nhất trên nguồn đã được import trước đó (trùng).",
                  });
                } else if ((res.data?.importedCount || 0) === 0) {
                  notify.warning({
                    title: "Crawl xong — không import bài nào",
                    description:
                      res.data?.message ||
                      `${res.data?.skippedCount || 0} bỏ qua, ${res.data?.failedCount || 0} lỗi. Xem Import logs.`,
                  });
                } else {
                  notify.success({
                    title: "Crawl completed",
                    description: `${res.data?.importedCount || 0} bài mới vào Pending.`,
                  });
                }
                queryClient.invalidateQueries({ queryKey: ["newsroom-sources"] });
                queryClient.invalidateQueries({ queryKey: ["newsroom-stats"] });
                queryClient.invalidateQueries({ queryKey: ["news"] });
                queryClient.invalidateQueries({ queryKey: ["newsroom-activity"] });
              } catch (err) {
                notify.error({ title: "Crawl failed", description: err?.message });
              } finally {
                setCrawling(false);
              }
            }}
            disabled={!operational || crawling}
            className="h-9 px-3 inline-flex items-center gap-2 rounded-md bg-foreground text-background text-sm font-semibold disabled:opacity-60"
          >
            {crawling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Crawl & Translate News
          </button>
          <button
            type="button"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["newsroom-sources"] })
            }
            className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="h-9 px-3 inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90"
            disabled={!operational}
          >
            <Plus className="h-4 w-4" />
            Add source
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                setSeeding(true);
                const res = await newsroomService.seedDefaultSources();
                notify.success({
                  title: "Default sources seeded",
                  description: `${res.data?.created || 0} created, ${res.data?.updated || 0} updated. Enable tested sources before crawling.`,
                });
                queryClient.invalidateQueries({ queryKey: ["newsroom-sources"] });
                queryClient.invalidateQueries({ queryKey: ["newsroom-stats"] });
              } catch (err) {
                notify.error({ title: "Seed failed", description: err?.message });
              } finally {
                setSeeding(false);
              }
            }}
            className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-xs disabled:opacity-60"
            disabled={!operational || seeding}
          >
            {seeding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Seed Thera Derma sources
          </button>
        </div>
      </div>

      {operational && sources.length > 0 && enabledCount === 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          No source is enabled yet. Test one source, enable it, then run Crawl
          & Translate News. Crawled articles will still be saved as pending,
          never auto-published.
        </div>
      ) : null}

      {!operational ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <div className="h-12 w-12 mx-auto rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-3">
            <Rss className="h-5 w-5" />
          </div>
          <div className="text-base font-semibold">
            Source registry not enabled
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            The backend endpoints under{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">
              /api/newsroom/sources
            </code>{" "}
            are not active yet. Run the latest migration{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">
              CreateNewsroomOpsTables
            </code>{" "}
            on the API to start tracking sources here.
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card h-48 animate-pulse"
            />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="text-base font-semibold">No sources yet</div>
          <p className="text-sm text-muted-foreground mt-1">
            Seed the 36 default university sources, or add your first source manually.
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                setSeeding(true);
                const res = await newsroomService.seedDefaultSources();
                notify.success({
                  title: "Default sources seeded",
                  description: `${res.data?.created || 0} created, ${res.data?.updated || 0} updated.`,
                });
                queryClient.invalidateQueries({ queryKey: ["newsroom-sources"] });
              } catch (err) {
                notify.error({ title: "Seed failed", description: err?.message });
              } finally {
                setSeeding(false);
              }
            }}
            disabled={seeding}
            className="mt-4 h-9 px-3 inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60"
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Seed 36 default sources
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      )}

      {crawlResult ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <div className="font-semibold">Last crawl result</div>
          {crawlResult.message ? (
            <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
              {crawlResult.message}
            </div>
          ) : null}
          <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
            <Stat label="Sources" value={crawlResult.scannedSources || 0} />
            <Stat label="Imported" value={crawlResult.importedCount || 0} tone="success" />
            <Stat label="Pending" value={crawlResult.pendingCount || 0} tone="warning" />
            <Stat label="Skipped" value={crawlResult.skippedCount || 0} />
            <Stat label="Failed" value={crawlResult.failedCount || 0} tone={crawlResult.failedCount ? "danger" : "default"} />
          </div>
        </div>
      ) : null}

      {creating ? (
        <SourceFormDialog onClose={() => setCreating(false)} />
      ) : null}
    </div>
  );
}

function SourceCard({ source }) {
  const queryClient = useQueryClient();
  const palette =
    HEALTH_STATES[source.health || "paused"] || HEALTH_STATES.paused;
  const HealthIcon = palette.icon;
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await newsroomService.runSource(source.id);
      notify.success({ title: "Source run completed" });
      setTestResult({
        valid: true,
        rejectReason: null,
        preview: null,
        summary: res.data,
      });
      queryClient.invalidateQueries({ queryKey: ["newsroom-sources"] });
      queryClient.invalidateQueries({ queryKey: ["newsroom-stats"] });
    } catch (err) {
      notify.error({ title: "Sync failed", description: err?.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const res = await newsroomService.testSource(source.id);
      setTestResult(res.data);
      if (res.data?.valid) notify.success({ title: "Source test passed" });
      else notify.error({ title: "Source test rejected", description: res.data?.rejectReason });
    } catch (err) {
      notify.error({ title: "Test failed", description: err?.message });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete source "${source.name}"?`)) return;
    try {
      await newsroomService.deleteSource(source.id);
      notify.success({ title: "Source removed" });
      queryClient.invalidateQueries({ queryKey: ["newsroom-sources"] });
    } catch (err) {
      notify.error({ title: "Delete failed", description: err?.message });
    }
  };

  const articlesPerDay = Number(source.articlesPerDay || 0);
  const failureRate = Number(source.failureRate || 0);
  const trustScore = Number(source.trustScore || 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center text-foreground/70 shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{source.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {source.listUrl || source.url}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold",
            palette.badge,
          )}
        >
          <HealthIcon className="h-3 w-3" />
          {source.health || "paused"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
        <Stat label="Articles/day" value={articlesPerDay} />
        <Stat
          label="Failure rate"
          value={`${failureRate.toFixed(1)}%`}
          tone={failureRate > 10 ? "warning" : "default"}
        />
        <Stat
          label="Trust score"
          value={`${trustScore}/100`}
          tone={trustScore >= 70 ? "success" : "warning"}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Last sync{" "}
          {source.lastSyncedAt
            ? new Date(source.lastSyncedAt).toLocaleString("en-US", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "—"}
        </span>
        <span>{source.language || "vi"}</span>
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={Boolean(source.enabled)}
          onChange={async (event) => {
            await newsroomService.updateSource(source.id, {
              enabled: event.target.checked,
            });
            queryClient.invalidateQueries({ queryKey: ["newsroom-sources"] });
          }}
        />
        Enabled for Crawl & Translate
      </label>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-border text-xs"
        >
          {testing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Test
        </button>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-border text-xs"
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Run Source
        </button>
        <button
          type="button"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          title="Edit"
        >
          <Edit className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {testResult ? (
        <div className="mt-3 rounded-md border border-border bg-background/60 p-3 text-xs">
          <div className={testResult.valid ? "text-emerald-600" : "text-red-600"}>
            {testResult.valid ? "Valid" : "Rejected"}
            {testResult.rejectReason ? `: ${testResult.rejectReason}` : ""}
          </div>
          {testResult.preview ? (
            <div className="mt-2">
              <div className="font-semibold line-clamp-2">{testResult.preview.originalTitle}</div>
              <div className="text-muted-foreground line-clamp-1">{testResult.preview.sourceUrl}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone = "default" }) {
  const toneStyles = {
    default: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-300",
    danger: "text-red-600",
  };
  return (
    <div className="rounded-md border border-border bg-background/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn("text-sm font-semibold tabular-nums", toneStyles[tone])}
      >
        {value}
      </div>
    </div>
  );
}

function SourceFormDialog({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    url: "",
    sourceType: "html",
    language: "en",
    enabled: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.url) {
      notify.error({ title: "Name and URL are required" });
      return;
    }
    try {
      setSubmitting(true);
      await newsroomService.createSource({
        ...form,
        listUrl: form.url,
        sourceName: form.name,
        autoPublish: false,
      });
      notify.success({ title: "Source added" });
      queryClient.invalidateQueries({ queryKey: ["newsroom-sources"] });
      onClose();
    } catch (err) {
      notify.error({
        title: "Could not create source",
        description: err?.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
        <div className="px-5 py-4 border-b border-border">
          <div className="text-base font-semibold">Add news source</div>
          <div className="text-xs text-muted-foreground">
            Connect an RSS feed or API endpoint
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <Field label="Display name">
            <input
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Reuters Vietnam"
            />
          </Field>
            <Field label="List URL">
            <input
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm font-mono"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://example.edu/news"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
                value={form.sourceType}
                onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
              >
                <option value="html">HTML</option>
                <option value="wordpress">WordPress</option>
                <option value="joomla">Joomla</option>
                <option value="query_param">Query param</option>
                <option value="headless_html">Headless HTML</option>
              </select>
            </Field>
            <Field label="Language">
              <select
                className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="hu">Hungarian</option>
                <option value="de">German</option>
                <option value="vi">Vietnamese</option>
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm({ ...form, enabled: e.target.checked })
              }
            />
            Enable after saving
          </label>
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 inline-flex items-center rounded-md border border-border text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-3 inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Create source
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}
