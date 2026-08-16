import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  RefreshCw,
  Pencil,
  ExternalLink,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { newsService } from "@/api/blogService";
import { useStaffAuth } from "@/lib/AuthContext";
import { notify } from "@/lib/notify";
import { resolvePublicUploadsUrl } from "@/api/apiUrl";
import StatusPill from "@/components/newsroom/StatusPill";
import { cn } from "@/lib/utils";
import { newsroomT as t } from "@/lib/newsroomI18n";

const STATUS_TABS = [
  { key: "all", label: t.articles.tabs.all },
  { key: "pending", label: t.articles.tabs.pending },
  { key: "published", label: t.articles.tabs.published },
  { key: "scheduled", label: t.articles.tabs.scheduled },
  { key: "draft", label: t.articles.tabs.draft },
  { key: "archived", label: t.articles.tabs.archived },
];

const CATEGORY_OPTIONS = [
  { key: "all", label: t.articles.allCategories },
  { key: "news", label: t.articles.categories.news },
  { key: "announcement", label: t.articles.categories.announcement },
  { key: "scholarship", label: t.articles.categories.scholarship },
  { key: "event", label: t.articles.categories.event },
];

const SORT_OPTIONS = [
  { key: "recent", label: t.articles.sort.recent },
  { key: "oldest", label: t.articles.sort.oldest },
  { key: "popular", label: t.articles.sort.popular },
];

export default function NewsroomArticles() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useStaffAuth();
  const isAdmin = user?.role === "admin" || user?.role === "staff" || user?.role === "super_admin";
  const isContentAdmin = user?.role === "content_admin";
  const canManageAll = isAdmin || isContentAdmin;
  const canCreateInAdmin = isAdmin || isContentAdmin;

  const initialStatus = params.get("status") || (isAdmin ? "pending" : "all");
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState(params.get("category") || "all");
  const [sort, setSort] = useState(params.get("sort") || "recent");
  const [search, setSearch] = useState(params.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const [scope, setScope] = useState(
    params.get("scope") || (canManageAll ? "all" : "mine"),
  );
  const [selected, setSelected] = useState(new Set());
  const limit = 12;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (status !== "pending") next.set("status", status);
    else next.delete("status");
    if (category !== "all") next.set("category", category);
    else next.delete("category");
    if (sort !== "recent") next.set("sort", sort);
    else next.delete("sort");
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");
    if (page !== 1) next.set("page", String(page));
    else next.delete("page");
    if (scope !== (canManageAll ? "all" : "mine")) next.set("scope", scope);
    else next.delete("scope");
    setParams(next, { replace: true });
    setSelected(new Set());
     
  }, [status, category, sort, debouncedSearch, page, scope]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [
      "newsroom-articles",
      { status, category, sort, debouncedSearch, page, scope, canManageAll },
    ],
    queryFn: () =>
      newsService.listNews({
        lang: "vi",
        page,
        limit,
        auth: true,
        mine: scope === "mine" || !canManageAll,
        status: status === "all" ? undefined : status,
        category: category === "all" ? undefined : category,
        sort: sort === "recent" ? undefined : sort,
        search: debouncedSearch || undefined,
      }),
    keepPreviousData: true,
    staleTime: 15_000,
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelected(new Set(items.map((i) => i.id)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const handleApprove = async (id) => {
    try {
      await newsService.approveNews(id);
      notify.success({ title: t.articles.notify.approved });
      queryClient.invalidateQueries({ queryKey: ["newsroom-articles"] });
      queryClient.invalidateQueries({ queryKey: ["newsroom-stats"] });
    } catch (error) {
      notify.error({ title: t.articles.notify.approveFailed, description: error?.message });
    }
  };

  const handleReject = async (id) => {
    try {
      await newsService.rejectNews(id);
      notify.success({ title: t.articles.notify.sentToDraft });
      queryClient.invalidateQueries({ queryKey: ["newsroom-articles"] });
    } catch (error) {
      notify.error({ title: t.articles.notify.rejectFailed, description: error?.message });
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(t.articles.notify.deleteConfirm)
    )
      return;
    try {
      await newsService.deleteNews(id);
      notify.success({ title: t.articles.notify.deleteRequested });
      queryClient.invalidateQueries({ queryKey: ["newsroom-articles"] });
    } catch (error) {
      notify.error({ title: t.articles.notify.deleteFailed, description: error?.message });
    }
  };

  const handleSubmit = async (id) => {
    try {
      await newsService.submitNews(id);
      notify.success({ title: t.articles.notify.submitted });
      queryClient.invalidateQueries({ queryKey: ["newsroom-articles"] });
    } catch (error) {
      notify.error({ title: t.articles.notify.submitFailed, description: error?.message });
    }
  };

  const handleBulkApprove = async () => {
    if (!isAdmin) return;
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(t.articles.notify.bulkApproveConfirm(ids.length))) return;
    let success = 0;
    for (const id of ids) {
      try {
        await newsService.approveNews(id);
        success += 1;
      } catch (error) {
        // continue
      }
    }
    notify.success({ title: t.articles.notify.bulkApproved(success, ids.length) });
    queryClient.invalidateQueries({ queryKey: ["newsroom-articles"] });
    queryClient.invalidateQueries({ queryKey: ["newsroom-stats"] });
    setSelected(new Set());
  };

  const allChecked = items.length > 0 && items.every((i) => selected.has(i.id));

  return (
    <div className="px-4 lg:px-6 py-6 space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t.articles.title}</h2>
          <p className="text-sm text-muted-foreground">
            {search
              ? t.articles.countMatching(total, search)
              : t.articles.count(total)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className={cn(
              "h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-xs",
              isFetching && "opacity-70",
            )}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            />
            {t.articles.refresh}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/news/create")}
            className="h-9 px-3 inline-flex items-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            {t.articles.newArticle}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="px-3 pt-3 flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-2 text-sm rounded-t-md border-b-2 transition-colors -mb-px",
                  active
                    ? "border-accent text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="border-t border-border px-3 py-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t.articles.searchPlaceholder}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="h-9 px-2 rounded-md border border-border bg-background text-sm"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="h-9 px-2 rounded-md border border-border bg-background text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          {canManageAll ? (
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setScope("all");
                  setPage(1);
                }}
                className={cn(
                  "px-3 h-9 text-xs",
                  scope === "all"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.articles.scope.all}
              </button>
              <button
                type="button"
                onClick={() => {
                  setScope("mine");
                  setPage(1);
                }}
                className={cn(
                  "px-3 h-9 text-xs border-l border-border",
                  scope === "mine"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.articles.scope.mine}
              </button>
            </div>
          ) : null}
        </div>

        {selected.size > 0 ? (
          <div className="border-t border-border px-3 py-2.5 flex items-center justify-between gap-3 bg-muted/40">
            <div className="text-xs text-muted-foreground">
              {t.articles.selected(selected.size)}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-500/90"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t.articles.bulkApprove}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="h-8 px-3 inline-flex items-center rounded-md border border-border text-xs"
              >
                {t.articles.clear}
              </button>
            </div>
          </div>
        ) : null}

        <div className="border-t border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 w-10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    aria-label={t.articles.table.selectAll}
                  />
                </th>
                <th className="text-left px-3 py-2">{t.articles.table.article}</th>
                <th className="text-left px-3 py-2 w-28">{t.articles.table.status}</th>
                <th className="text-left px-3 py-2 w-32 hidden md:table-cell">
                  {t.articles.table.category}
                </th>
                <th className="text-left px-3 py-2 w-32 hidden lg:table-cell">
                  {t.articles.table.created}
                </th>
                <th className="text-left px-3 py-2 w-20 hidden lg:table-cell">
                  {t.articles.table.views}
                </th>
                <th className="text-right px-3 py-2 w-44">{t.articles.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && items.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td colSpan={7} className="px-3 py-4">
                      <div className="h-10 rounded bg-muted/40 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-12 text-center text-muted-foreground"
                  >
                    {t.articles.table.empty}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <ArticleRow
                    key={item.id}
                    item={item}
                    selected={selected.has(item.id)}
                    onToggle={() => toggleSelect(item.id)}
                    onView={() => navigate(`/${item.slug}`)}
                    onEdit={() =>
                      navigate(`/admin/news/create?id=${item.id}`)
                    }
                    onApprove={() => handleApprove(item.id)}
                    onReject={() => handleReject(item.id)}
                    onSubmit={() => handleSubmit(item.id)}
                    onDelete={() => handleDelete(item.id)}
                    isAdmin={isAdmin}
                    isContentAdmin={isContentAdmin}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-3 py-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            {t.articles.pagination.page(page, totalPages)}
          </div>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 px-2 inline-flex items-center gap-1 rounded-md border border-border disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t.articles.pagination.prev}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 px-2 inline-flex items-center gap-1 rounded-md border border-border disabled:opacity-50"
            >
              {t.articles.pagination.next}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArticleRow({
  item,
  selected,
  onToggle,
  onView,
  onEdit,
  onApprove,
  onReject,
  onSubmit,
  onDelete,
  isAdmin,
  isContentAdmin,
}) {
  const created = item.created_at ? new Date(item.created_at) : null;
  const thumb = resolvePublicUploadsUrl(item.thumbnail_url);
  const status = String(item.status || "draft");

  return (
    <tr
      className={cn(
        "border-t border-border hover:bg-muted/40 transition-colors",
        selected && "bg-accent/5",
      )}
    >
      <td className="px-3 py-3 align-top">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${item.title}`}
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-14 rounded-md bg-muted overflow-hidden border border-border shrink-0">
            {thumb ? (
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                {t.articles.table.noImage}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={onEdit}
              className="text-sm font-medium hover:text-accent text-left line-clamp-2"
            >
              {item.title}
            </button>
            {item.excerpt ? (
              <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                {item.excerpt}
              </div>
            ) : null}
            {Array.isArray(item.tags) && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 3 ? (
                  <span className="text-[10px] text-muted-foreground">
                    +{item.tags.length - 3}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <StatusPill status={status} />
        {item.is_featured ? (
          <div className="mt-1 text-[10px] uppercase tracking-wider text-accent font-semibold">
            {t.articles.table.featured}
          </div>
        ) : null}
      </td>
      <td className="px-3 py-3 align-middle text-xs text-muted-foreground hidden md:table-cell">
        {item.category}
      </td>
      <td className="px-3 py-3 align-middle text-xs text-muted-foreground hidden lg:table-cell">
        {created
          ? created.toLocaleDateString("vi-VN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—"}
      </td>
      <td className="px-3 py-3 align-middle text-xs text-muted-foreground hidden lg:table-cell tabular-nums">
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {item.views ?? 0}
        </span>
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="flex items-center justify-end gap-1">
          <ActionIconButton
            onClick={onView}
            title={t.articles.actions.viewPublic}
            icon={ExternalLink}
          />
          <ActionIconButton onClick={onEdit} title={t.articles.actions.edit} icon={Pencil} />
          {!isAdmin && !isContentAdmin && status === "draft" ? (
            <ActionIconButton onClick={onSubmit} title={t.articles.actions.submit} icon={Send} />
          ) : null}
          {isAdmin && status === "pending" ? (
            <>
              <ActionIconButton
                onClick={onApprove}
                title={t.articles.actions.approve}
                icon={CheckCircle2}
                tone="success"
              />
              <ActionIconButton
                onClick={onReject}
                title={t.articles.actions.reject}
                icon={XCircle}
                tone="danger"
              />
            </>
          ) : null}
          <ActionIconButton
            onClick={onDelete}
            title={t.articles.actions.delete}
            icon={Trash2}
            tone="danger"
          />
        </div>
      </td>
    </tr>
  );
}

function ActionIconButton({ icon: Icon, title, onClick, tone = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "h-7 w-7 inline-flex items-center justify-center rounded-md border border-transparent",
        "text-muted-foreground hover:bg-muted/60",
        tone === "success" && "hover:text-emerald-600",
        tone === "danger" && "hover:text-red-600",
        tone === "default" && "hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
