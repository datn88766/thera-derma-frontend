import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { Sheet, SheetContent } from "@/components/ui/sheet";

import NewsroomSidebar from "./NewsroomSidebar";
import NewsroomHeader from "./NewsroomHeader";
import NewsroomCommandPalette from "./NewsroomCommandPalette";
import NewsroomActivityFeed from "./NewsroomActivityFeed";
import NewsroomProvider, { useNewsroom } from "./NewsroomProvider";
import { resolveNewsroomPageMeta } from "@/lib/newsroomI18n";

function resolveMeta(pathname) {
  return resolveNewsroomPageMeta(pathname);
}

function NewsroomLayoutShell({
  meta,
  isCollapsed,
  showFull,
  sidebarFloating,
  sidebarSpacerWidth,
  onToggleSidebar,
  onHoverChange,
  mobileNavOpen,
  setMobileNavOpen,
  paletteOpen,
  setPaletteOpen,
  feedOpen,
  setFeedOpen,
  isReviewRoute,
}) {
  const navigate = useNavigate();
  const { badges, refreshAll, events, eventsLoading } = useNewsroom();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <div
        className="hidden lg:block shrink-0 transition-[width] duration-200 ease-out"
        style={{ width: sidebarSpacerWidth }}
      >
        <NewsroomSidebar
          collapsed={!showFull}
          floating={sidebarFloating}
          onHoverChange={onHoverChange}
          onToggle={onToggleSidebar}
          badges={badges}
        />
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="p-0 w-[260px] bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
        >
          <NewsroomSidebar
            collapsed={false}
            onToggle={() => setMobileNavOpen(false)}
            badges={badges}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0 flex flex-col">
        <NewsroomHeader
          title={meta.title}
          description={meta.description}
          badges={badges}
          onCommandOpen={() => setPaletteOpen(true)}
          onCreate={() => navigate("/admin/news/create")}
          onMobileMenu={() => setMobileNavOpen(true)}
          feedOpen={feedOpen}
          onToggleFeed={() => setFeedOpen((prev) => !prev)}
          showActivityFeed={!isReviewRoute}
        />

        <div className="flex-1 min-w-0 flex overflow-hidden">
          <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
            <Outlet />
          </main>
          {feedOpen && !isReviewRoute ? (
            <NewsroomActivityFeed
              events={events}
              loading={eventsLoading}
              onRefresh={refreshAll}
            />
          ) : null}
        </div>
      </div>

      <NewsroomCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onRefresh={refreshAll}
      />
    </div>
  );
}

export default function NewsroomLayout() {
  const location = useLocation();
  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("icstest_newsroom_sidebar_collapsed");
      if (stored !== null) setManualCollapsed(stored === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "icstest_newsroom_sidebar_collapsed",
        manualCollapsed ? "1" : "0",
      );
    } catch {
      // ignore
    }
  }, [manualCollapsed]);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const y = typeof window !== "undefined" ? window.scrollY : 0;
      setAutoCollapsed(y > 80);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setAutoCollapsed(false);
    setHovered(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isCollapsed = manualCollapsed || autoCollapsed;
  const showFull = !isCollapsed || hovered;
  const sidebarFloating = isCollapsed && hovered;
  const sidebarSpacerWidth = isCollapsed ? 68 : 248;
  const meta = useMemo(() => resolveMeta(location.pathname), [location.pathname]);
  const isReviewRoute = location.pathname.includes("/admin/newsroom/review");

  useEffect(() => {
    if (isReviewRoute) setFeedOpen(false);
  }, [isReviewRoute]);

  return (
    <NewsroomProvider onOpenCommandPalette={() => setPaletteOpen(true)}>
      <NewsroomLayoutShell
        meta={meta}
        isReviewRoute={isReviewRoute}
        isCollapsed={isCollapsed}
        showFull={showFull}
        sidebarFloating={sidebarFloating}
        sidebarSpacerWidth={sidebarSpacerWidth}
        onToggleSidebar={() => {
          if (isCollapsed) {
            setManualCollapsed(false);
            setAutoCollapsed(false);
            setHovered(false);
          } else {
            setManualCollapsed(true);
          }
        }}
        onHoverChange={setHovered}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        paletteOpen={paletteOpen}
        setPaletteOpen={setPaletteOpen}
        feedOpen={feedOpen}
        setFeedOpen={setFeedOpen}
      />
    </NewsroomProvider>
  );
}
