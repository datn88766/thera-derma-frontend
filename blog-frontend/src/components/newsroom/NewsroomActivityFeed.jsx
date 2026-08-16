import React from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Sparkles,
  Inbox,
  Send,
  Edit3,
  Trash2,
  Filter,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { newsroomT as t } from "@/lib/newsroomI18n";

const SEVERITY_STYLES = {
  info: {
    icon: Info,
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
  },
  success: {
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  warning: {
    icon: AlertTriangle,
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
  },
  error: {
    icon: XCircle,
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
  },
};

const ACTION_ICONS = {
  "news.create": Edit3,
  "news.update": Edit3,
  "news.approve": CheckCircle2,
  "news.reject": XCircle,
  "news.publish": Send,
  "news.translate": Sparkles,
  "news.import": Inbox,
  "news.delete": Trash2,
};

function safeFromNow(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  } catch {
    return date.toLocaleString();
  }
}

export default function NewsroomActivityFeed({
  events = [],
  loading = false,
  onRefresh,
}) {
  return (
    <aside className="hidden lg:flex w-[320px] xl:w-[360px] shrink-0 flex-col border-l border-border bg-card/40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="text-sm font-semibold">{t.activity.title}</div>
          <div className="text-[11px] text-muted-foreground">
            {t.activity.subtitle}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted/60 text-muted-foreground"
            title={t.activity.filter}
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="text-[11px] font-semibold text-accent hover:underline"
          >
            {t.activity.refresh}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && events.length === 0 ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-14 rounded-md bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {t.activity.empty}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => {
              const severity =
                SEVERITY_STYLES[event.severity] || SEVERITY_STYLES.info;
              const ActionIcon = ACTION_ICONS[event.action] || severity.icon;
              return (
                <li
                  key={event.id}
                  className="px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 relative">
                      <span
                        className={cn(
                          "absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full",
                          severity.dot,
                        )}
                      />
                      <div className="h-7 w-7 rounded-md bg-muted/70 flex items-center justify-center">
                        <ActionIcon
                          className={cn("h-3.5 w-3.5", severity.text)}
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-snug">
                        {event.title || event.action}
                      </div>
                      {event.description ? (
                        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {event.description}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="uppercase tracking-wider">
                          {event.source === "system" ? t.activity.system : event.source}
                        </span>
                        <span>•</span>
                        <span>{safeFromNow(event.createdAt)}</span>
                        {event.actorName ? (
                          <>
                            <span>•</span>
                            <span className="truncate">{event.actorName}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
