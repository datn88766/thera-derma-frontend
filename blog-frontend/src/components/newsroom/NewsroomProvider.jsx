import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { newsroomService } from "@/api/blogNewsroomService";
import { newsService } from "@/api/blogService";
import { useStaffAuth } from "@/lib/AuthContext";

const NewsroomContext = createContext(null);

export function useNewsroom() {
  const ctx = useContext(NewsroomContext);
  if (!ctx) {
    throw new Error("useNewsroom must be used within NewsroomProvider");
  }
  return ctx;
}

export default function NewsroomProvider({ children, onOpenCommandPalette }) {
  const { user } = useStaffAuth();

  const statsQuery = useQuery({
    queryKey: ["newsroom-stats"],
    queryFn: async () => {
      try {
        const res = await newsroomService.getStats();
        return res.data || res;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const eventsQuery = useQuery({
    queryKey: ["newsroom-events"],
    queryFn: async () => {
      try {
        const res = await newsroomService.getEvents({ limit: 30 });
        return res.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const fallbackPendingQuery = useQuery({
    queryKey: ["newsroom-fallback-pending"],
    enabled: !statsQuery.isLoading && !statsQuery.data,
    queryFn: async () => {
      const res = await newsService.listNews({
        lang: "vi",
        page: 1,
        limit: 1,
        auth: true,
        status: "pending",
      });
      return res.total ?? 0;
    },
    staleTime: 30_000,
  });

  const fallbackScheduledQuery = useQuery({
    queryKey: ["newsroom-fallback-scheduled"],
    enabled: !statsQuery.isLoading && !statsQuery.data,
    queryFn: async () => {
      const res = await newsService.listNews({
        lang: "vi",
        page: 1,
        limit: 1,
        auth: true,
        status: "scheduled",
      });
      return res.total ?? 0;
    },
    staleTime: 30_000,
  });

  const stats = statsQuery.data;
  const badges = useMemo(() => {
    if (stats?.badges) return stats.badges;
    return {
      pending: fallbackPendingQuery.data ?? 0,
      scheduled: fallbackScheduledQuery.data ?? 0,
      imports: 0,
    };
  }, [stats, fallbackPendingQuery.data, fallbackScheduledQuery.data]);

  const refreshAll = () => {
    statsQuery.refetch();
    eventsQuery.refetch();
    fallbackPendingQuery.refetch();
    fallbackScheduledQuery.refetch();
  };

  const ctx = useMemo(
    () => ({
      stats,
      statsLoading: statsQuery.isLoading,
      events: eventsQuery.data || [],
      eventsLoading: eventsQuery.isLoading,
      badges,
      refreshAll,
      user,
      openCommandPalette:
        typeof onOpenCommandPalette === "function"
          ? onOpenCommandPalette
          : () => {},
      backendOperationalReady: Boolean(stats),
    }),
    [
      stats,
      statsQuery.isLoading,
      eventsQuery.data,
      eventsQuery.isLoading,
      badges,
      user,
      onOpenCommandPalette,
    ],
  );

  return (
    <NewsroomContext.Provider value={ctx}>
      {children}
    </NewsroomContext.Provider>
  );
}
