import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  Languages,
  Pencil,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import { newsService } from "@/api/blogService";
import { resolvePublicUploadsUrl } from "@/api/apiUrl";
import { useNewsroom } from "@/components/newsroom/NewsroomProvider";
import StatusPill from "@/components/newsroom/StatusPill";
import { useStaffAuth } from "@/lib/AuthContext";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

const PRIORITY_BUCKETS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "scheduled", label: "Scheduled" },
  { key: "draft", label: "Drafts" },
];

const INSPECTOR_TABS = [
  { key: "quality", label: "AI quality" },
  { key: "activity", label: "Activity" },
];

export default function NewsroomReviewQueue() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useStaffAuth();
  const { events, eventsLoading, refreshAll } = useNewsroom();
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "content_admin";

  const [bucket, setBucket] = useState("pending");
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [inspectorTab, setInspectorTab] = useState("quality");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["review-queue", bucket],
    queryFn: () =>
      newsService.listNews({
        lang: "vi",
        auth: true,
        page: 1,
        limit: 50,
        status: bucket === "all" ? undefined : bucket,
        sort: undefined,
      }),
    staleTime: 15_000,
  });

  const items = data?.data ?? [];

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const haystack = [
        item.title,
        item.excerpt,
        item.sourceName,
        item.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, query]);

  useEffect(() => {
    if (!activeId && filteredItems.length > 0) {
      setActiveId(filteredItems[0].id);
      return;
    }
    if (activeId && !filteredItems.find((i) => i.id === activeId)) {
      setActiveId(filteredItems[0]?.id || null);
      return;
    }
    if (filteredItems.length === 0) {
      setActiveId(null);
    }
  }, [filteredItems, activeId]);

  const activeItem = useMemo(
    () => filteredItems.find((i) => i.id === activeId) || null,
    [filteredItems, activeId],
  );

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["review-queue-detail", activeId],
    enabled: Boolean(activeId),
    queryFn: async () => {
      const [vi, en] = await Promise.all([
        newsService.getNewsById(activeId, { lang: "vi", auth: true }),
        newsService.getEnglishByVietnameseId(activeId).catch(() => null),
      ]);
      return { vi: vi.data, en: en?.data || null };
    },
    staleTime: 30_000,
  });

  const activeIndex = filteredItems.findIndex((i) => i.id === activeId);
  const canPrev = activeIndex > 0;
  const canNext = activeIndex >= 0 && activeIndex < filteredItems.length - 1;

  const goNext = () => {
    if (!canNext) return;
    setActiveId(filteredItems[activeIndex + 1].id);
  };

  const goPrev = () => {
    if (!canPrev) return;
    setActiveId(filteredItems[activeIndex - 1].id);
  };

  const handleApprove = async () => {
    if (!activeId || !isAdmin) return;
    try {
      await newsService.approveNews(activeId);
      notify.success({ title: "Approved" });
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      queryClient.invalidateQueries({ queryKey: ["newsroom-stats"] });
      goNext();
    } catch (error) {
      notify.error({ title: "Approve failed", description: error?.message });
    }
  };

  const handleReject = async () => {
    if (!activeId || !isAdmin) return;
    try {
      await newsService.rejectNews(activeId);
      notify.success({ title: "Sent back to draft" });
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
      goNext();
    } catch (error) {
      notify.error({ title: "Reject failed", description: error?.message });
    }
  };

  const handleEdit = () => {
    if (activeId) navigate(`/admin/news/create?id=${activeId}`);
  };

  useEffect(() => {
    const handler = (event) => {
      if (event.target.matches?.("input,textarea,select")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      switch (event.key.toLowerCase()) {
        case "j":
          event.preventDefault();
          goNext();
          break;
        case "k":
          event.preventDefault();
          goPrev();
          break;
        case "a":
          if (isAdmin && activeItem?.status === "pending") {
            event.preventDefault();
            handleApprove();
          }
          break;
        case "r":
          if (isAdmin && activeItem?.status === "pending") {
            event.preventDefault();
            handleReject();
          }
          break;
        case "e":
          event.preventDefault();
          handleEdit();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeItem, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col overflow-hidden px-4 pb-4 lg:px-6">
      <div className="newsroom-review-grid grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)_minmax(280px,320px)]">
        <ReviewQueuePanel
          items={filteredItems}
          rawCount={items.length}
          isLoading={isLoading}
          isFetching={isFetching}
          query={query}
          setQuery={setQuery}
          bucket={bucket}
          setBucket={setBucket}
          activeId={activeId}
          setActiveId={setActiveId}
          onRefresh={() => refetch()}
        />

        <ArticleReviewPanel
          item={activeItem}
          detail={detailData}
          detailLoading={detailLoading}
          isAdmin={isAdmin}
          canPrev={canPrev}
          canNext={canNext}
          onPrev={goPrev}
          onNext={goNext}
          onEdit={handleEdit}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        <NewsInspectorPanel
          tab={inspectorTab}
          onTabChange={setInspectorTab}
          item={activeItem}
          detail={detailData}
          events={events}
          eventsLoading={eventsLoading}
          onRefreshActivity={refreshAll}
        />
      </div>
    </div>
  );
}

function ReviewQueuePanel({
  items,
  rawCount,
  isLoading,
  isFetching,
  query,
  setQuery,
  bucket,
  setBucket,
  activeId,
  setActiveId,
  onRefresh,
}) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/50">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold">Review queue</p>
            <p className="text-xs text-muted-foreground">
              {rawCount} items • {bucket}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            {isFetching ? "Refreshing" : "Refresh"}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
          {PRIORITY_BUCKETS.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => setBucket(b.key)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap",
                bucket === b.key
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, source..."
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {isLoading && items.length === 0 ? (
          Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="h-24 animate-pulse rounded-lg bg-muted/40" />
          ))
        ) : items.length === 0 ? (
          <div className="px-3 py-12 text-center text-xs text-muted-foreground">
            <Inbox className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
            Không có mục phù hợp bộ lọc.
          </div>
        ) : (
          items.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              active={activeId === item.id}
              onSelect={() => setActiveId(item.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function QueueCard({ item, active, onSelect }) {
  const created = item.created_at ? new Date(item.created_at) : null;
  const source = item.sourceName || (item.isExternal || item.is_external ? "External source" : "Internal");
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-colors",
        active
          ? "border-primary/70 bg-primary/10"
          : "border-border bg-background/60 hover:border-foreground/20",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {item.category || "news"}
        </span>
        <StatusPill status={item.status} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-tight text-foreground">
        {item.title}
      </p>
      <p className="mt-1 text-[11px] text-primary">{source}</p>
      {item.excerpt ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.excerpt}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {created
            ? created.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
            : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {item.views ?? 0}
        </span>
      </div>
    </button>
  );
}

function ArticleReviewPanel({
  item,
  detail,
  detailLoading,
  isAdmin,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onEdit,
  onApprove,
  onReject,
}) {
  if (!item) {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/50">
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="text-base font-semibold">Chọn một bài viết để xem chi tiết</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn một bài viết trong hàng đợi để bắt đầu duyệt.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const vi = detail?.vi || item;
  const en = detail?.en;
  const created = item.created_at ? new Date(item.created_at) : null;
  const thumb = resolvePublicUploadsUrl(item.thumbnail_url);
  const isExternal = Boolean(
    vi?.isExternal || vi?.is_external || item.isExternal || item.is_external,
  );
  const sourceName = vi?.sourceName || item.sourceName;
  const sourceUrl = vi?.sourceUrl || item.sourceUrl;
  const imageCreditText = vi?.imageCreditText || item.imageCreditText;
  const imageUsageStatus = vi?.imageUsageStatus || item.imageUsageStatus;
  const wordCount = countPlainText(vi?.content || "")
    .split(/\s+/)
    .filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 220));
  const status = String(item.status || "draft");

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/50">
      <header className="border-b border-border px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 uppercase tracking-wider">
                {item.category || "news"}
              </span>
              <StatusPill status={item.status} />
              {created ? <span>{created.toLocaleString("vi-VN")}</span> : null}
            </div>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
              {vi?.title || item.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{wordCount} từ</span>
              <span>~{readingTime} phút đọc</span>
              <span>Tác giả #{item.author_id}</span>
              {sourceName ? <span>Nguồn: {sourceName}</span> : null}
            </div>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={onPrev}
              disabled={!canPrev}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
              title="Mục trước (K)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canNext}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
              title="Mục sau (J)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {vi?.excerpt ? (
          <p className="mb-4 rounded-lg border border-border bg-background/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
            {vi.excerpt}
          </p>
        ) : null}

        {thumb ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-border bg-muted">
            <img src={thumb} alt="" className="max-h-[320px] w-full object-cover" />
          </div>
        ) : null}

        {isExternal ? (
          <div className="mb-4 rounded-lg border border-border bg-background/50 p-4 text-sm">
            <p className="font-semibold text-foreground">External article</p>
            <p className="mt-1 text-muted-foreground">
              {imageCreditText || `Source: ${sourceName || "Original source"}`}
              {imageUsageStatus === "needs_review"
                ? " — kiểm tra quyền sử dụng ảnh trước khi xuất bản."
                : ""}
            </p>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline"
              >
                Mở bài gốc
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          <ContentPanel
            label="Tiếng Việt"
            title={vi?.title}
            content={vi?.content}
            loading={detailLoading}
          />
          <ContentPanel
            label="Tiếng Anh"
            title={en?.title}
            content={en?.content}
            empty={en ? null : "Chưa có bản tiếng Anh. Dùng editor để dịch."}
            loading={detailLoading}
          />
        </div>
      </div>

      <footer className="border-t border-border bg-card/70 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <kbd className="rounded border border-border px-1">J</kbd> sau
            <kbd className="ml-2 rounded border border-border px-1">K</kbd> trước
            {isAdmin && status === "pending" ? (
              <>
                <kbd className="ml-2 rounded border border-border px-1">A</kbd> duyệt
                <kbd className="ml-2 rounded border border-border px-1">R</kbd> từ chối
              </>
            ) : null}
            <kbd className="ml-2 rounded border border-border px-1">E</kbd> sửa
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-muted/40"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground"
              title="Dịch trong trang editor"
            >
              <Languages className="h-3.5 w-3.5" />
              Translate
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground"
              title="Hẹn giờ trong trang editor"
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Schedule
            </button>
            {isAdmin && status === "pending" ? (
              <>
                <button
                  type="button"
                  onClick={onReject}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-red-500/40 px-3 text-sm font-semibold text-red-600 hover:bg-red-500/10"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-500 px-3 text-sm font-semibold text-white hover:bg-emerald-500/90"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve & publish
                </button>
              </>
            ) : null}
          </div>
        </div>
      </footer>
    </section>
  );
}

function NewsInspectorPanel({
  tab,
  onTabChange,
  item,
  detail,
  events,
  eventsLoading,
  onRefreshActivity,
}) {
  if (!item) {
    return (
      <aside className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/50 xl:flex">
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div>
            <Inbox className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">Chưa chọn bài viết</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Chọn bài trong hàng đợi để xem tín hiệu AI và hoạt động.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const vi = detail?.vi || item;
  const en = detail?.en;
  const hasExcerpt = Boolean(vi?.excerpt && vi.excerpt.length > 30);
  const hasEnglish = Boolean(en && en.title && en.content);
  const hasSeo = Boolean(vi?.seo_title || vi?.seo_description);
  const wordCount = useMemo(
    () =>
      countPlainText(vi?.content || "")
        .split(/\s+/)
        .filter(Boolean).length,
    [vi?.content],
  );
  const aiSignals = [
    { label: "Title", score: vi?.title?.length > 20 ? 88 : 60 },
    { label: "Excerpt", score: hasExcerpt ? 92 : 40 },
    { label: "SEO", score: hasSeo ? 78 : 45 },
    { label: "Translation", score: hasEnglish ? 85 : 30 },
    { label: "Length", score: Math.min(100, Math.round((wordCount / 600) * 100)) },
  ];

  return (
    <aside className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/50 xl:flex">
      <div className="border-b border-border p-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background/50 p-1">
          {INSPECTOR_TABS.map((inspector) => (
            <button
              key={inspector.key}
              type="button"
              onClick={() => onTabChange(inspector.key)}
              className={cn(
                "h-8 flex-1 rounded-md text-xs font-medium",
                tab === inspector.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {inspector.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "quality" ? (
          <AIQualityTab aiSignals={aiSignals} />
        ) : (
          <ActivityTab
            events={events}
            loading={eventsLoading}
            onRefresh={onRefreshActivity}
          />
        )}
      </div>
    </aside>
  );
}

function AIQualityTab({ aiSignals }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">AI quality signals</p>
        <p className="text-xs text-muted-foreground">
          Heuristic tạm thời trước khi nối AI scoring service.
        </p>
      </div>

      <div className="space-y-3">
        {aiSignals.map((signal) => (
          <div key={signal.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{signal.label}</span>
              <span className="tabular-nums text-muted-foreground">{signal.score}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  signal.score >= 75
                    ? "bg-emerald-500"
                    : signal.score >= 50
                      ? "bg-amber-500"
                      : "bg-red-500",
                )}
                style={{ width: `${signal.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Risk checks
        </p>
        <RiskRow label="Duplicate similarity" value="—" tone="info" />
        <RiskRow label="Bias detection" value="—" tone="info" />
        <RiskRow label="Spam risk" value="—" tone="info" />
        <RiskRow label="Fact confidence" value="—" tone="info" />
      </div>

      <div className="rounded-md border border-dashed border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
        <AlertTriangle className="mr-1 inline h-3 w-3 text-amber-500" />
        Connect AI scoring service to populate.
      </div>
    </div>
  );
}

function ActivityTab({ events, loading, onRefresh }) {
  const rows = Array.isArray(events) ? events.slice(0, 20) : [];
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Live activity</p>
          <p className="text-xs text-muted-foreground">Sự kiện mới nhất trên pipeline.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-12 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
          Chưa có hoạt động gần đây.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((event, index) => (
            <div key={`${event.id || "evt"}-${index}`} className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-xs font-semibold text-foreground">{event.title || event.action || "Event"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {event.type || event.system || "system"} •{" "}
                {event.createdAt
                  ? new Date(event.createdAt).toLocaleString("vi-VN")
                  : event.time || "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentPanel({ label, title, content, empty, loading }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      {loading ? (
        <div className="space-y-2 p-4">
          <div className="h-5 animate-pulse rounded bg-muted/60" />
          <div className="h-3 animate-pulse rounded bg-muted/40" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted/40" />
        </div>
      ) : empty ? (
        <div className="p-6 text-center text-xs text-muted-foreground">{empty}</div>
      ) : (
        <div className="space-y-2 p-4">
          {title ? <p className="text-base font-semibold leading-snug">{title}</p> : null}
          <pre className="font-body text-sm leading-7 whitespace-pre-wrap text-foreground/90">
            {(content || "").slice(0, 4000)}
            {content && content.length > 4000 ? "\n\n…" : ""}
          </pre>
        </div>
      )}
    </div>
  );
}

function RiskRow({ label, value, tone = "info" }) {
  const toneStyles = {
    info: "text-muted-foreground",
    warning: "text-amber-600",
    danger: "text-red-600",
    success: "text-emerald-600",
  };
  return (
    <div className="flex items-center justify-between text-xs">
      <span>{label}</span>
      <span className={cn("font-mono", toneStyles[tone])}>{value}</span>
    </div>
  );
}

function countPlainText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
