import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  FileText,
  CalendarRange,
  Rss,
  Sparkles,
  BarChart3,
  Workflow,
  ScrollText,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useStaffAuth } from "@/lib/AuthContext";
import { newsroomT as t } from "@/lib/newsroomI18n";

const NAV_GROUPS = [
  {
    labelKey: "operate",
    items: [
      {
        key: "dashboard",
        labelKey: "dashboard",
        icon: LayoutDashboard,
        path: "/admin/newsroom",
      },
      {
        key: "review",
        labelKey: "review",
        icon: CheckSquare,
        path: "/admin/newsroom/review",
        badgeKey: "pending",
      },
      {
        key: "ingestion",
        labelKey: "ingestion",
        icon: Inbox,
        path: "/admin/newsroom/ingestion",
        badgeKey: "imports",
      },
    ],
  },
  {
    labelKey: "content",
    items: [
      {
        key: "articles",
        labelKey: "articles",
        icon: FileText,
        path: "/admin/news/create",
      },
      {
        key: "scheduler",
        labelKey: "scheduler",
        icon: CalendarRange,
        path: "/admin/newsroom/scheduler",
        badgeKey: "scheduled",
      },
      {
        key: "translation",
        labelKey: "translation",
        icon: Sparkles,
        path: "/admin/news/create?translate=1",
      },
    ],
  },
  {
    labelKey: "system",
    items: [
      {
        key: "sources",
        labelKey: "sources",
        icon: Rss,
        path: "/admin/newsroom/sources",
      },
      {
        key: "analytics",
        labelKey: "analytics",
        icon: BarChart3,
        path: "/admin/newsroom/analytics",
      },
      {
        key: "rules",
        labelKey: "rules",
        icon: Workflow,
        path: "/admin/newsroom/rules",
      },
      {
        key: "logs",
        labelKey: "logs",
        icon: ScrollText,
        path: "/admin/newsroom/logs",
      },
      {
        key: "settings",
        labelKey: "settings",
        icon: Settings,
        path: "/admin/newsroom/settings",
      },
    ],
  },
];

function roleCanAccessNewsroomItem(role, itemKey) {
  if (role !== "content_admin") return true;
  return [
    "dashboard",
    "review",
    "articles",
    "scheduler",
    "ingestion",
    "sources",
    "analytics",
    "logs",
    "translation",
  ].includes(itemKey);
}

function getInitials(value) {
  return (
    String(value || "U")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export default function NewsroomSidebar({
  collapsed,
  onToggle,
  badges = {},
  floating = false,
  onHoverChange,
}) {
  const { user } = useStaffAuth();
  const location = useLocation();
  const role = user?.role || "";

  const handleMouseEnter = onHoverChange
    ? () => onHoverChange(true)
    : undefined;
  const handleMouseLeave = onHoverChange
    ? () => onHoverChange(false)
    : undefined;

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "h-screen z-40 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-[width] duration-200 ease-out",
        floating
          ? "fixed top-0 left-0 shadow-2xl shadow-black/30"
          : "sticky top-0",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 h-16 px-4 border-b border-sidebar-border/70",
          collapsed && "px-2 justify-center",
        )}
      >
        <div className="h-9 w-9 rounded-lg bg-[#C9D8CF] text-[#2d3a2f] flex items-center justify-center font-bold tracking-tight">
          TD
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-tight truncate">
              {t.brand.title}
            </div>
            <div className="text-[11px] text-sidebar-foreground/60 truncate">
              {t.brand.subtitle}
            </div>
          </div>
        ) : null}
        {!collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="h-8 w-8 rounded-md hover:bg-sidebar-accent/40 flex items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground"
            title={t.sidebar.collapse}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {collapsed ? (
        <div className="flex justify-center pt-3">
          <button
            type="button"
            onClick={onToggle}
            className="h-8 w-8 rounded-md hover:bg-sidebar-accent/40 flex items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground"
            title={t.sidebar.expand}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            roleCanAccessNewsroomItem(role, item.key),
          );
          if (visibleItems.length === 0) return null;
          return (
          <div key={group.labelKey}>
            {!collapsed ? (
              <div className="px-4 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/45 mb-2">
                {t.sidebar.groups[group.labelKey]}
              </div>
            ) : (
              <div className="px-2 mb-2 h-px bg-sidebar-border/40" />
            )}
            <ul className="space-y-1 px-2">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
                const label = t.sidebar.items[item.labelKey];
                const itemPath = item.path.split("?")[0];
                const itemSearch = item.path.includes("?")
                  ? item.path.slice(item.path.indexOf("?"))
                  : "";
                const isActive =
                  location.pathname === itemPath &&
                  (itemSearch
                    ? location.search === itemSearch
                    : location.pathname !== "/admin/news/create" ||
                      !location.search.includes("translate=1"));
                return (
                  <li key={item.key}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/admin/newsroom"}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        collapsed && "justify-center px-2",
                        isActive
                          ? "bg-sidebar-accent/15 text-sidebar-foreground"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground",
                      )}
                      title={collapsed ? label : undefined}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isActive
                            ? "text-accent"
                            : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                        )}
                      />
                      {!collapsed ? (
                        <>
                          <span className="flex-1 truncate">{label}</span>
                          {Number.isFinite(badge) && badge > 0 ? (
                            <span
                              className={cn(
                                "ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums",
                                isActive
                                  ? "bg-accent/20 text-accent"
                                  : "bg-sidebar-accent/15 text-sidebar-foreground/80",
                              )}
                            >
                              {badge > 99 ? "99+" : badge}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border/70 p-3 flex items-center gap-3",
          collapsed && "justify-center",
        )}
      >
        <div className="h-9 w-9 rounded-full bg-accent/15 text-accent flex items-center justify-center font-semibold text-sm">
          {getInitials(user?.name || user?.email)}
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">
              {user?.name || user?.email}
            </div>
            <div className="text-[11px] text-sidebar-foreground/60 truncate uppercase tracking-wide">
              {t.sidebar.roles[user?.role] || user?.role || "staff"}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
