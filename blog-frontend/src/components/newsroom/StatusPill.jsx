import React from "react";
import { cn } from "@/lib/utils";
import { newsroomT } from "@/lib/newsroomI18n";

const TONES = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  archived: "bg-muted text-muted-foreground/80",
  failed: "bg-red-500/15 text-red-700 dark:text-red-300",
};

export default function StatusPill({ status, className }) {
  const labels = newsroomT.statusPill;
  const key = String(status || "draft").toLowerCase();
  const tone = TONES[key] || TONES.draft;
  const label = labels[key] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold",
        tone,
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-muted-foreground": key === "draft" || key === "archived",
          "bg-amber-500": key === "pending",
          "bg-emerald-500": key === "published",
          "bg-sky-500": key === "scheduled",
          "bg-red-500": key === "failed",
        })}
      />
      {label}
    </span>
  );
}
