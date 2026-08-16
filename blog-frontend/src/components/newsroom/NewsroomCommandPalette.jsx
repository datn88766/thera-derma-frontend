import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  CheckSquare,
  Inbox,
  FileText,
  CalendarRange,
  Sparkles,
  Rss,
  BarChart3,
  Workflow,
  ScrollText,
  Settings,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useStaffAuth } from "@/lib/AuthContext";
import { newsroomT as t } from "@/lib/newsroomI18n";

const NAV_ACTIONS = [
  {
    id: "dashboard",
    labelKey: "dashboard",
    path: "/admin/newsroom",
    icon: LayoutDashboard,
    shortcut: "G D",
  },
  {
    id: "review",
    labelKey: "review",
    path: "/admin/newsroom/review",
    icon: CheckSquare,
    shortcut: "G R",
  },
  {
    id: "ingestion",
    labelKey: "ingestion",
    path: "/admin/newsroom/ingestion",
    icon: Inbox,
    shortcut: "G I",
  },
  {
    id: "articles",
    labelKey: "createArticle",
    path: "/admin/news/create",
    icon: FileText,
    shortcut: "G A",
  },
  {
    id: "scheduler",
    labelKey: "scheduler",
    path: "/admin/newsroom/scheduler",
    icon: CalendarRange,
    shortcut: "G S",
  },
  {
    id: "translation",
    labelKey: "translation",
    path: "/admin/news/create?translate=1",
    icon: Sparkles,
  },
  {
    id: "sources",
    labelKey: "sources",
    path: "/admin/newsroom/sources",
    icon: Rss,
  },
  {
    id: "analytics",
    labelKey: "analytics",
    path: "/admin/newsroom/analytics",
    icon: BarChart3,
  },
  {
    id: "rules",
    labelKey: "rules",
    path: "/admin/newsroom/rules",
    icon: Workflow,
  },
  {
    id: "logs",
    labelKey: "logs",
    path: "/admin/newsroom/logs",
    icon: ScrollText,
  },
  {
    id: "settings",
    labelKey: "settings",
    path: "/admin/newsroom/settings",
    icon: Settings,
  },
];

const QUICK_ACTIONS = [
  {
    id: "new-article",
    labelKey: "newArticle",
    path: "/admin/news/create",
    icon: Plus,
    shortcut: "C",
  },
  {
    id: "refresh",
    labelKey: "refresh",
    action: "refresh",
    icon: RefreshCw,
  },
];

export default function NewsroomCommandPalette({
  open,
  onOpenChange,
  onRefresh,
}) {
  const navigate = useNavigate();
  const { user } = useStaffAuth();
  const [search, setSearch] = useState("");
  const isContentAdmin = user?.role === "content_admin";
  const visibleNavActions = useMemo(
    () =>
      isContentAdmin
        ? NAV_ACTIONS.filter((item) =>
            ["dashboard", "review", "articles", "scheduler"].includes(item.id),
          )
        : NAV_ACTIONS,
    [isContentAdmin],
  );

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.action === "refresh" && typeof onRefresh === "function") {
      onRefresh();
    }
    onOpenChange?.(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={t.commandPalette.searchPlaceholder}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{t.commandPalette.noMatches}</CommandEmpty>

        <CommandGroup heading={t.commandPalette.quickActions}>
          {QUICK_ACTIONS.map((item) => (
            <CommandItem
              key={item.id}
              value={t.commandPalette.actions[item.labelKey]}
              onSelect={() => handleSelect(item)}
            >
              <item.icon />
              <span>{t.commandPalette.actions[item.labelKey]}</span>
              {item.shortcut ? (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t.commandPalette.navigate}>
          {visibleNavActions.map((item) => (
            <CommandItem
              key={item.id}
              value={t.commandPalette.actions[item.labelKey]}
              onSelect={() => handleSelect(item)}
            >
              <item.icon />
              <span>{t.commandPalette.actions[item.labelKey]}</span>
              {item.shortcut ? (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
