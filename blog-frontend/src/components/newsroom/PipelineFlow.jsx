import React from "react";
import { ChevronRight, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * @typedef {Object} PipelineStage
 * @property {string} key
 * @property {string} label
 * @property {number} count
 * @property {string} [hint]
 * @property {"healthy" | "active" | "warning" | "error" | "idle"} state
 * @property {number} [warningCount]
 */

const STATE_STYLES = {
  healthy: {
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  active: {
    border: "border-accent/40",
    badge: "bg-accent/15 text-accent",
    dot: "bg-accent",
  },
  warning: {
    border: "border-amber-500/40",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  error: {
    border: "border-red-500/50",
    badge: "bg-red-500/15 text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
  idle: {
    border: "border-border",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
};

/**
 * @param {{ stages?: PipelineStage[]; onStageClick?: (stage: PipelineStage) => void }} props
 */
export default function PipelineFlow({ stages = [], onStageClick }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold">Live pipeline</div>
          <div className="text-xs text-muted-foreground">
            From source ingestion to publish
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[11px]">
          <Legend label="Healthy" tone="healthy" />
          <Legend label="Active" tone="active" />
          <Legend label="Warning" tone="warning" />
          <Legend label="Error" tone="error" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex items-stretch gap-2 min-w-max">
          {stages.map((stage, index) => {
            const tone = STATE_STYLES[stage.state] || STATE_STYLES.idle;
            const isInteractive = typeof onStageClick === "function";
            return (
              <React.Fragment key={stage.key}>
                <button
                  type="button"
                  onClick={() => isInteractive && onStageClick(stage)}
                  className={cn(
                    "relative w-[150px] sm:w-[170px] rounded-lg border bg-background/60 p-3 text-left transition-colors",
                    tone.border,
                    isInteractive && "hover:border-foreground/30",
                    stage.state === "error" &&
                      "shadow-[0_0_0_1px_rgba(239,68,68,0.25)]",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Stage {index + 1}
                    </div>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        tone.dot,
                        stage.state === "error" && "animate-pulse",
                      )}
                    />
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-tight truncate">
                    {stage.label}
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="text-2xl font-semibold tabular-nums">
                      {stage.count ?? 0}
                    </div>
                    {stage.warningCount ? (
                      <div className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{stage.warningCount}</span>
                      </div>
                    ) : null}
                  </div>
                  {stage.hint ? (
                    <div className="mt-1 text-[11px] text-muted-foreground truncate">
                      {stage.hint}
                    </div>
                  ) : null}
                </button>
                {index < stages.length - 1 ? (
                  <div className="self-center text-muted-foreground/60">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Legend({ label, tone }) {
  const palette = STATE_STYLES[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", palette.dot)} />
      {label}
    </span>
  );
}
