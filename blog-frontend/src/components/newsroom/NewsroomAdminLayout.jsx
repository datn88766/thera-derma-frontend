import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import NewsroomProvider, { useNewsroom } from "./NewsroomProvider";
import NewsroomCommandPalette from "./NewsroomCommandPalette";
import NewsroomActivityFeed from "./NewsroomActivityFeed";

function NewsroomAdminShell({ paletteOpen, setPaletteOpen }) {
  const { events, eventsLoading, refreshAll } = useNewsroom();
  const location = useLocation();
  const isReviewRoute = location.pathname.includes("/admin/newsroom/review");

  return (
    <div className="flex-1 min-w-0 flex">
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
      {!isReviewRoute ? (
        <NewsroomActivityFeed
          events={events}
          loading={eventsLoading}
          onRefresh={refreshAll}
        />
      ) : null}

      <NewsroomCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onRefresh={refreshAll}
      />
    </div>
  );
}

export default function NewsroomAdminLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);

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

  return (
    <NewsroomProvider onOpenCommandPalette={() => setPaletteOpen(true)}>
      <NewsroomAdminShell
        paletteOpen={paletteOpen}
        setPaletteOpen={setPaletteOpen}
      />
    </NewsroomProvider>
  );
}
