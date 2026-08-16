import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  ScrollText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { newsroomService } from "@/api/blogNewsroomService";
import { cn } from "@/lib/utils";

const SEVERITY_OPTIONS = [
  { key: "all", label: "All severities" },
  { key: "info", label: "Info" },
  { key: "success", label: "Success" },
  { key: "warning", label: "Warning" },
  { key: "error", label: "Error" },
];

const SEVERITY_COLORS = {
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  error: "bg-red-500/15 text-red-700 dark:text-red-300",
  debug: "bg-muted text-muted-foreground",
};

export default function NewsroomLogs() {
  const [severity, setSeverity] = useState("all");
  const [expanded, setExpanded] = useState(new Set());

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["newsroom-logs", severity],
    queryFn: async () => {
      try {
        const res = await newsroomService.getLogs({
          severity: severity === "all" ? undefined : severity,
          limit: 100,
        });
        return res.data || [];
      } catch (err) {
        const message = err?.message || "";
        if (/404/.test(message) || /Not Found/i.test(message)) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  const { data: importRunsData } = useQuery({
    queryKey: ["newsroom-import-runs"],
    queryFn: async () => {
      const res = await newsroomService.listImportRuns({ limit: 20 });
      return res.data || [];
    },
    staleTime: 30_000,
  });

  const operational = data !== null;
  const logs = Array.isArray(data) ? data : [];
  const importRuns = Array.isArray(importRunsData) ? importRunsData : [];

  const toggle = (id) => {
    setExpanded((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  return (
    <div className="px-4 lg:px-6 py-6 space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">System logs</h2>
          <p className="text-sm text-muted-foreground">
            Structured pipeline events with severity and payload.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="h-9 px-2 rounded-md border border-border bg-background text-sm"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-xs"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            />
            Refresh
          </button>
        </div>
      </div>

      {!operational ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <div className="h-12 w-12 mx-auto rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-3">
            <ScrollText className="h-5 w-5" />
          </div>
          <div className="text-base font-semibold">
            Structured logs not enabled
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            Endpoint{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">
              /api/newsroom/logs
            </code>{" "}
            is not active yet. Once the migration{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">
              CreateNewsroomOpsTables
            </code>{" "}
            is applied, workflow events from ingestion / moderation / publishing
            will stream here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading && logs.length === 0 ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-10 rounded bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No log entries match these filters.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {logs.map((log) => {
                const isOpen = expanded.has(log.id);
                const sevTone =
                  SEVERITY_COLORS[log.severity || "info"] ||
                  SEVERITY_COLORS.info;
                return (
                  <li
                    key={log.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(log.id)}
                      className="w-full text-left flex items-start gap-3 px-4 py-3"
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 mt-0.5 text-muted-foreground transition-transform",
                          isOpen && "rotate-90",
                        )}
                      />
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold shrink-0",
                          sevTone,
                        )}
                      >
                        {log.severity || "info"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-tight">
                          {log.title || log.action || "event"}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          <span className="uppercase tracking-wider">
                            {log.source || "system"}
                          </span>
                          <span className="mx-1.5">•</span>
                          <span>{log.action}</span>
                          <span className="mx-1.5">•</span>
                          <span>
                            {log.createdAt ? safeFromNow(log.createdAt) : ""}
                          </span>
                          {log.actorName ? (
                            <>
                              <span className="mx-1.5">•</span>
                              <span>{log.actorName}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      {log.severity === "error" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      ) : null}
                    </button>
                    {isOpen ? (
                      <div className="px-12 pb-4 -mt-1">
                        {log.description ? (
                          <div className="text-sm text-muted-foreground mb-2">
                            {log.description}
                          </div>
                        ) : null}
                        <pre className="text-[11px] font-mono bg-background border border-border rounded-md p-3 overflow-auto max-h-64">
                          {JSON.stringify(
                            log.payload || log.meta || {},
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold">Import runs</div>
          <div className="text-[11px] text-muted-foreground">
            Crawl & Translate News summaries and counters.
          </div>
        </div>
        {importRuns.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No import runs yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {importRuns.map((run) => (
              <div key={run.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">
                    Run #{run.id} - {run.status}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {run.startedAt ? safeFromNow(run.startedAt) : ""}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <span>Sources: {run.scannedSources || 0}</span>
                  <span>Imported: {run.importedCount || 0}</span>
                  <span>Pending: {run.pendingCount || 0}</span>
                  <span>Skipped: {run.skippedCount || 0}</span>
                  <span>Failed: {run.failedCount || 0}</span>
                </div>
                {run.errorMessage ? (
                  <div className="mt-2 text-xs text-red-600 line-clamp-2">
                    {run.errorMessage}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function safeFromNow(value) {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return new Date(value).toLocaleString();
  }
}
