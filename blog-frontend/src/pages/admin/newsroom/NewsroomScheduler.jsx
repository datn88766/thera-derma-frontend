import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Clock,
  Plus,
} from "lucide-react";

import { newsService } from "@/api/blogService";
import { cn } from "@/lib/utils";
import StatusPill from "@/components/newsroom/StatusPill";

function startOfWeek(date) {
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const result = new Date(date);
  result.setDate(date.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function buildWeek(anchor) {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }).map((_, idx) => {
    const day = new Date(start);
    day.setDate(start.getDate() + idx);
    return day;
  });
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const HOURS = Array.from({ length: 18 }).map((_, idx) => idx + 6); // 6 AM -> 11 PM

export default function NewsroomScheduler() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(() => new Date());

  const { data, isLoading } = useQuery({
    queryKey: ["scheduler-articles"],
    queryFn: () =>
      newsService.listNews({
        lang: "vi",
        auth: true,
        page: 1,
        limit: 100,
        status: "scheduled",
      }),
    staleTime: 30_000,
  });

  const items = data?.data ?? [];
  const week = useMemo(() => buildWeek(anchor), [anchor]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const day of week) {
      map.set(day.toISOString().slice(0, 10), []);
    }
    for (const item of items) {
      if (!item.scheduled_at) continue;
      const date = new Date(item.scheduled_at);
      const key = date.toISOString().slice(0, 10);
      if (map.has(key)) {
        map.get(key).push({ ...item, scheduledDate: date });
      }
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.scheduledDate - b.scheduledDate);
    }
    return map;
  }, [items, week]);

  const goPrev = () =>
    setAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });

  const goNext = () =>
    setAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });

  const today = new Date();

  return (
    <div className="px-4 lg:px-6 py-6 space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Editorial scheduler
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length} scheduled article{items.length === 1 ? "" : "s"} •
            week of{" "}
            {week[0].toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-xs"
          >
            Today
          </button>
          <div className="inline-flex">
            <button
              type="button"
              onClick={goPrev}
              className="h-9 w-9 rounded-l-md border border-border inline-flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="h-9 w-9 rounded-r-md border border-border border-l-0 inline-flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/news/create")}
            className="h-9 px-3 inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Schedule article
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b border-border text-xs font-semibold">
          <div className="px-2 py-2 text-muted-foreground" />
          {week.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "px-3 py-2 border-l border-border",
                  isToday && "bg-accent/10",
                )}
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    isToday ? "text-accent" : "text-foreground",
                  )}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))]">
          {HOURS.map((hour) => (
            <React.Fragment key={hour}>
              <div className="px-2 py-2 text-[11px] text-muted-foreground border-t border-border">
                {String(hour).padStart(2, "0")}:00
              </div>
              {week.map((day) => {
                const key = day.toISOString().slice(0, 10);
                const dayItems = (byDay.get(key) || []).filter(
                  (item) => item.scheduledDate.getHours() === hour,
                );
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="border-t border-l border-border min-h-[64px] p-1 space-y-1"
                  >
                    {dayItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          navigate(`/admin/news/create?id=${item.id}`)
                        }
                        className="w-full text-left rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-1.5 hover:border-sky-500/60 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] text-sky-700 dark:text-sky-300">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {item.scheduledDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                          <span className="uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium leading-tight line-clamp-2 mt-0.5 text-foreground">
                          {item.title}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold">Upcoming queue</div>
            <div className="text-xs text-muted-foreground">
              All scheduled articles, soonest first
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-12 rounded-md bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-xs text-muted-foreground py-8 text-center">
            <CalendarRange className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
            Nothing scheduled. Use the editor to schedule a publish time.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items
              .slice()
              .sort(
                (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at),
              )
              .slice(0, 8)
              .map((item) => (
                <li
                  key={item.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium line-clamp-1">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(item.scheduled_at).toLocaleString("en-US")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <StatusPill status={item.status} />
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/news/create?id=${item.id}`)
                      }
                      className="h-7 px-2 inline-flex items-center rounded-md border border-border text-xs hover:bg-muted/40"
                    >
                      Open
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
