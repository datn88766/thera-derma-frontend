import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Inbox,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { newsroomService } from "@/api/blogNewsroomService";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "auto_published", label: "Auto-published" },
  { key: "duplicate", label: "Duplicates" },
  { key: "rejected", label: "Rejected" },
  { key: "failed", label: "Failed" },
  { key: "all", label: "All" },
];

const STATUS_TONE = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  auto_published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  duplicate: "bg-muted text-muted-foreground",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
  failed: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export default function NewsroomIngestion() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["newsroom-imports", status, page],
    queryFn: async () => {
      try {
        const res = await newsroomService.listImports({ status, page, limit });
        return { items: res.data || [], total: res.total || 0 };
      } catch (err) {
        const message = err?.message || "";
        if (/404/.test(message) || /Not Found/i.test(message)) {
          return null;
        }
        throw err;
      }
    },
    keepPreviousData: true,
    staleTime: 15_000,
  });

  const operational = data !== null;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="px-4 lg:px-6 py-6 space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Ingestion inbox
          </h2>
          <p className="text-sm text-muted-foreground">
            Auto-imported items from RSS / API / scrapers waiting to be
            normalized, scored and routed.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["newsroom-imports"] })
          }
          className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-xs"
          disabled={isFetching}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
          />
          Refresh
        </button>
      </div>

      {!operational ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <div className="h-12 w-12 mx-auto rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-3">
            <Inbox className="h-5 w-5" />
          </div>
          <div className="text-base font-semibold">Ingestion not enabled</div>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            Endpoint{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">
              /api/newsroom/imports
            </code>{" "}
            is not active yet. Apply the{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">
              CreateNewsroomOpsTables
            </code>{" "}
            migration and add an ingestion worker to populate this inbox.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-3 pt-3 flex items-center gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => {
              const active = status === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                  className={cn(
                    "px-3 py-2 text-sm rounded-t-md border-b-2 transition-colors -mb-px whitespace-nowrap",
                    active
                      ? "border-accent text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border">
            {isLoading && items.length === 0 ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-14 rounded bg-muted/40 animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="p-10 text-center text-sm text-red-600 inline-flex items-center justify-center gap-2 w-full">
                <AlertTriangle className="h-4 w-4" />
                {error.message || "Failed to load ingestion items"}
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                <Inbox className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
                No items match this filter. Run a source sync to populate the
                inbox.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <ImportRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-3 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {total} item{total === 1 ? "" : "s"} • Page {page} of {totalPages}
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 px-2 inline-flex items-center gap-1 rounded-md border border-border disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 px-2 inline-flex items-center gap-1 rounded-md border border-border disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImportRow({ item }) {
  const tone = STATUS_TONE[item.status] || STATUS_TONE.pending;
  return (
    <li className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <div className="h-9 w-9 rounded-md bg-muted/60 flex items-center justify-center text-foreground/70">
            <Inbox className="h-4 w-4" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold",
                tone,
              )}
            >
              {String(item.status).replace("_", " ")}
            </span>
            {item.aiScore != null ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
                <Sparkles className="h-3 w-3" />
                AI {item.aiScore}
              </span>
            ) : null}
            {item.duplicateScore != null && item.duplicateScore > 60 ? (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                dup {item.duplicateScore}%
              </span>
            ) : null}
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.createdAt ? safeFromNow(item.createdAt) : ""}
            </span>
          </div>
          <div className="text-sm font-medium leading-snug mt-1 line-clamp-2">
            {item.title}
          </div>
          {item.excerpt ? (
            <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
              {item.excerpt}
            </div>
          ) : null}
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
            {item.author ? <span>{item.author}</span> : null}
            <span className="uppercase tracking-wider">
              source #{item.sourceId}
            </span>
            {item.canonicalUrl ? (
              <a
                href={item.canonicalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                Source <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>
        {item.status === "pending" ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 text-xs"
              disabled
              title="Approve action wires up with newsroom worker"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              type="button"
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-red-500/10 text-red-700 hover:bg-red-500/15 text-xs"
              disabled
              title="Reject action wires up with newsroom worker"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function safeFromNow(value) {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return new Date(value).toLocaleString();
  }
}
