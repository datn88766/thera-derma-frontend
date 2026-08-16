import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Menu, Home, Activity } from "lucide-react";

import { cn } from "@/lib/utils";
import { newsroomT as t } from "@/lib/newsroomI18n";

export default function NewsroomHeader({
  title,
  description,
  badges = {},
  onCommandOpen,
  onCreate,
  onMobileMenu,
  rightSlot,
  feedOpen,
  onToggleFeed,
  showActivityFeed = true,
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65 border-b border-border">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
        <button
          type="button"
          onClick={onMobileMenu}
          className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-md border border-border text-foreground/70 hover:text-foreground"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          {title ? (
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-base lg:text-lg font-semibold truncate">
                {title}
              </h1>
              {description ? (
                <p className="text-xs lg:text-sm text-muted-foreground truncate">
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {Number.isFinite(badges.pending) ? (
            <button
              type="button"
              onClick={() => navigate("/admin/newsroom/review")}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border text-xs hover:bg-muted/40"
              title={t.header.pendingReviews}
            >
              <Activity className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-medium">{badges.pending}</span>
              <span className="text-muted-foreground">{t.header.pending}</span>
            </button>
          ) : null}
          {Number.isFinite(badges.scheduled) && badges.scheduled > 0 ? (
            <button
              type="button"
              onClick={() => navigate("/admin/newsroom/scheduler")}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border text-xs hover:bg-muted/40"
              title={t.header.scheduledArticles}
            >
              <span className="font-medium">{badges.scheduled}</span>
              <span className="text-muted-foreground">{t.header.scheduled}</span>
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onCommandOpen}
          className={cn(
            "hidden md:flex items-center gap-2 h-9 min-w-[260px] px-3 rounded-md",
            "border border-border bg-card/60 text-sm text-muted-foreground",
            "hover:border-foreground/30 hover:text-foreground transition-colors",
          )}
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">
            {t.header.searchPlaceholder}
          </span>
          <kbd className="text-[10px] tracking-wider px-1.5 py-0.5 rounded border border-border bg-background">
            Ctrl K
          </kbd>
        </button>

        {rightSlot}

        {showActivityFeed ? (
        <button
          type="button"
          onClick={onToggleFeed}
          className={cn(
            "hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-md border border-border",
            feedOpen
              ? "bg-muted/60 text-foreground"
              : "text-foreground/70 hover:text-foreground",
          )}
          title={t.header.toggleFeed}
        >
          <Activity className="h-4 w-4" />
        </button>
        ) : null}

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-accent text-accent-foreground font-semibold text-sm shadow-sm hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t.header.newArticle}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="hidden xl:inline-flex h-9 px-3 items-center gap-2 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground"
          title={t.header.home}
        >
          <Home className="h-3.5 w-3.5" />
          {t.header.home}
        </button>
      </div>
    </header>
  );
}
