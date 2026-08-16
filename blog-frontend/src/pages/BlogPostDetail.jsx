import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { newsService } from "@/api/blogService";
import { useLang } from "@/lib/i18n";
import {
  ArrowLeft,
  Megaphone,
  BookOpen,
  CalendarDays,
  Newspaper,
  Clock,
  Eye,
  Facebook,
  Linkedin,
  Link as LinkIcon,
  User,
} from "lucide-react";
import { getApiOrigin, resolvePublicUploadsUrl } from "@/api/apiUrl";
import { formatNewsDate } from "@/lib/newsDate";

const categoryConfig = {
  announcement: {
    icon: Megaphone,
    color: "bg-amber-100 text-amber-700",
    label: "Thông báo",
    labelEn: "Announcement",
  },
  scholarship: {
    icon: BookOpen,
    color: "bg-blue-100 text-blue-700",
    label: "Học bổng",
    labelEn: "Scholarship",
  },
  event: {
    icon: CalendarDays,
    color: "bg-emerald-100 text-emerald-700",
    label: "Sự kiện",
    labelEn: "Event",
  },
  news: {
    icon: Newspaper,
    color: "bg-slate-100 text-slate-600",
    label: "Tin tức",
    labelEn: "News",
  },
};

const getCategoryConfig = (category) => {
  switch (category) {
    case "announcement":
      return categoryConfig.announcement;
    case "event":
      return categoryConfig.event;
    case "news":
      return categoryConfig.news;
    default:
      return categoryConfig.news;
  }
};

const NEWS_ASSET_URL_PATTERN =
  "(?:https?:\\/\\/[^\\s)\\]}]+|\\/uploads\\/[^\\s)\\]}]+)";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeNewsMarkdown(value) {
  let out = String(value || "");
  if (!out) return out;

  // Remove broken `![alt](bad-url)` patterns: empty url, placeholder `https://`, or non-http/uploads link.
  out = out.replace(/!\[([^\]\n]*)\]\(([^)\n]*)\)/g, (match, alt, url) => {
    const trimmed = String(url || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\/?$/i.test(trimmed)) return "";
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/uploads/"))
      return "";
    return `![${String(alt || "").trim()}](${trimmed})`;
  });

  // Drop dangling `![text](` or `![text` without closing on the same line.
  out = out.replace(/!\[[^\]\n]*\([^)\n]*$/gm, "");
  out = out.replace(/!\[[^\]\n]*$/gm, "");

  // Collapse runaway blank lines created by the cleanup.
  out = out.replace(/\n{3,}/g, "\n\n");

  // Legacy bug: h2 replacer used "$1" literally inside a function callback.
  out = out.replace(/^\s*\$1\s*$/gm, "");

  return out;
}

function renderEditorContent(value) {
  const raw = sanitizeNewsMarkdown(value);
  const looksLikeEditorMarkdown =
    /\{\{video:/.test(raw) ||
    /!\[[^\]]*\]\(/.test(raw) ||
    /^#{1,3}\s+/m.test(raw) ||
    /\*\*[^*]+\*\*/.test(raw) ||
    /^>\s+/m.test(raw);

  if (!looksLikeEditorMarkdown) {
    return raw;
  }

  const safe = escapeHtml(raw);
  let h2Index = 0;
  let html = safe
    .replace(
      /^###\s+(.*)$/gm,
      '<h3 class="text-2xl font-bold mt-8 mb-4">$1</h3>',
    )
    .replace(
      /^##\s+(.*)$/gm,
      (_match, p1) =>
        `<h2 id="heading-${h2Index++}" class="text-3xl font-bold mt-12 mb-6 text-primary">${p1}</h2>`,
    )
    .replace(
      /^#\s+(.*)$/gm,
      '<h1 class="text-4xl font-bold mt-12 mb-6">$1</h1>',
    )
    .replace(
      /^>\s+(.*)$/gm,
      '<blockquote class="border-l-4 border-accent bg-accent/5 p-6 my-8 rounded-r-xl italic text-xl text-foreground/90 font-medium shadow-sm">$1</blockquote>',
    )
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      new RegExp(`!\\[(.*?)\\]\\((${NEWS_ASSET_URL_PATTERN})\\)`, "g"),
      (_match, alt, url) => {
        const [captionPart, creditPart] = String(alt || "").split("|");
        const caption = (captionPart || "").trim();
        const credit = (creditPart || "").trim();
        const captionHtml = caption
          ? `<figcaption class=\"text-center text-sm text-muted-foreground mt-3\">${caption}${
              credit
                ? `<span class=\"block text-xs italic text-muted-foreground/80 mt-1\">Ảnh: ${credit}</span>`
                : ""
            }</figcaption>`
          : credit
            ? `<figcaption class=\"text-center text-xs italic text-muted-foreground/80 mt-3\">Ảnh: ${credit}</figcaption>`
            : "";
        return `<figure class=\"my-10\"><img src=\"${url}\" alt=\"${caption}\" class=\"w-full rounded-2xl shadow-lg\" />${captionHtml}</figure>`;
      },
    )
    // Strip any remaining malformed image markdown that survived sanitization.
    .replace(/!\[[^\]\n]*\]\([^)\n]*\)/g, "")
    .replace(/!\[[^\]\n]*$/gm, "")
    .replace(
      new RegExp(`\\[(.*?)\\]\\((${NEWS_ASSET_URL_PATTERN})\\)`, "g"),
      '<a href="$2" target="_blank" rel="noreferrer" class="text-accent hover:underline font-semibold">$1</a>',
    )
    .replace(
      new RegExp(`\\{\\{video:(${NEWS_ASSET_URL_PATTERN})\\}\\}`, "g"),
      (_match, url) => {
        if (String(url).startsWith("/uploads/")) {
          return `<video class=\"w-full rounded-2xl shadow-lg my-10\" src=\"${url}\" controls playsinline></video>`;
        }
        return `<div class=\"aspect-video w-full my-10\"><iframe class=\"w-full h-full rounded-2xl shadow-lg\" src=\"${url}\" frameborder=\"0\" allowfullscreen></iframe></div>`;
      },
    );

  return html
    .split(/\n\s*\n/)
    .map((block) => {
      const trimmed = block.trim();
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<figure") ||
        trimmed.startsWith('<div class="aspect-video')
      ) {
        return block;
      }
      if (!trimmed) return "";
      return `<p class="mb-6 leading-[1.8] text-[18px] text-foreground/90">${block.replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

export default function NewsDetail() {
  const { slug } = useParams();
  const { lang } = useLang();
  const navigate = useNavigate();
  const apiOrigin = getApiOrigin();
  const [copied, setCopied] = useState(false);
  const articleContentRef = useRef(null);
  const backToHomePath = lang === "en" ? "/en" : "/";

  const absolutizeUploadsInHtml = (html) => {
    if (!html) return html;
    const prefix = `${apiOrigin}/uploads/`;
    return html
      .replace(/src=(['"])\/uploads\//gi, `src=$1${prefix}`)
      .replace(/href=(['"])\/uploads\//gi, `href=$1${prefix}`);
  };

  const { data: item = null, isLoading } = useQuery({
    queryKey: ["news-detail", slug, lang],
    queryFn: async () => {
      if (!slug) return null;
      try {
        const response = await newsService.getNewsBySlug(slug, { lang });
        return response.data;
      } catch (_error) {
        if (lang === "en") {
          const vi = await newsService
            .getNewsBySlug(slug, { lang: "vi" })
            .then((r) => r.data);
          if (!vi?.id) return null;
          const en = await newsService
            .getEnglishByVietnameseId(vi.id)
            .then((r) => r.data);
          if (en?.slug && en.slug !== slug) {
            navigate(`/${en.slug}`, { replace: true });
          }
          return en || null;
        }
        const en = await newsService
          .getNewsBySlug(slug, { lang: "en" })
          .then((r) => r.data);
        const viId = en?.news_vi_id;
        if (!viId) return null;
        const vi = await newsService
          .getNewsById(viId, { lang: "vi" })
          .then((r) => r.data);
        if (vi?.slug && vi.slug !== slug) {
          navigate(`/${vi.slug}`, { replace: true });
        }
        return vi || null;
      }
    },
  });

  const { data: relatedNews } = useQuery({
    queryKey: ["news-related", lang, item?.id],
    queryFn: async () => {
      if (!item) return [];
      const res = await newsService.listNews({
        lang,
        limit: 3,
        category: item.category,
      });
      return res.data.filter((x) => x.id !== item.id).slice(0, 3);
    },
    enabled: !!item,
  });

  const contentHtml = item?.content
    ? absolutizeUploadsInHtml(renderEditorContent(item.content))
    : "";

  useEffect(() => {
    const root = articleContentRef.current;
    if (!root) return undefined;

    const videos = Array.from(root.querySelectorAll("video"));
    if (!videos.length) return undefined;

    videos.forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("preload", "metadata");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!(video instanceof HTMLVideoElement)) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.play().catch(() => {});
            return;
          }

          video.pause();
        });
      },
      {
        threshold: [0.25, 0.6, 0.9],
      },
    );

    videos.forEach((video) => observer.observe(video));

    return () => {
      observer.disconnect();
      videos.forEach((video) => video.pause());
    };
  }, [contentHtml]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 gap-4">
        <p className="font-heading text-xl text-muted-foreground">
          Bài viết không tồn tại.
        </p>
        <Link
          to={backToHomePath}
          className="font-body text-accent hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const cfg = getCategoryConfig(item.category);
  const Icon = cfg.icon;
  const thumbnailSrc = item.thumbnail_url
    ? resolvePublicUploadsUrl(item.thumbnail_url)
    : null;
  const readTime = Math.max(
    1,
    Math.ceil((item.content || "").split(" ").length / 200),
  );
  const isExternal = Boolean(item.isExternal || item.is_external);
  const sourceName = item.sourceName || item.source_name;
  const sourceUrl = item.sourceUrl || item.source_url;
  const imageCreditText = item.imageCreditText || item.image_credit_text;
  const imageSourceUrl = item.imageSourceUrl || item.image_source_url || sourceUrl;
  const imageUsageStatus = item.imageUsageStatus || item.image_usage_status;

  const toc = [];
  if (item.content) {
    const headings = item.content.match(/^##\s+(.*)$/gm);
    if (headings) {
      headings.forEach((h, i) => {
        toc.push({ text: h.replace(/^##\s+/, ""), id: `heading-${i}` });
      });
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
        {thumbnailSrc ? (
          <div className="absolute inset-0">
            <img
              src={thumbnailSrc}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-primary" />
        )}

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center mt-10">
          <Link
            to={backToHomePath}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />{" "}
            {lang === "vi" ? "Quay lại tin tức" : "Back to news"}
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.color}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {lang === "vi" ? cfg.label : cfg.labelEn}
            </span>
          </div>

          <h1 className="font-heading text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 max-w-4xl mx-auto">
            {item.title}
          </h1>

          {item.excerpt && (
            <p className="font-body text-xl lg:text-2xl text-white/90 leading-relaxed mb-8 max-w-3xl mx-auto font-light">
              {item.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm font-medium">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" /> Admin
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />{" "}
              {formatNewsDate(item.created_at)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> {readTime} phút đọc
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" /> {item.views || 0} lượt xem
            </div>
          </div>

          {isExternal && thumbnailSrc && imageUsageStatus !== "placeholder" ? (
            <div className="mt-5 text-xs text-white/75">
              {imageCreditText || `Image source: ${sourceName || "Original source"}`}
              {imageSourceUrl ? (
                <>
                  {" "}
                  <a
                    href={imageSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-white"
                  >
                    Original image/article link
                  </a>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Left Content */}
          <div className="flex-1 lg:max-w-3xl">
            {isExternal ? (
              <div className="mb-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
                <div className="font-semibold text-foreground">
                  Source: {sourceName || "Official source"}
                </div>
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-accent font-semibold hover:underline"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Read original article
                  </a>
                ) : null}
              </div>
            ) : null}

            {contentHtml && (
              <div
                ref={articleContentRef}
                className="font-body article-content"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            )}

            {/* Block CTA giữa bài (Optional / Hardcoded for demo) */}
            <div className="my-12 p-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl border border-primary/20 text-center">
              <h3 className="text-2xl font-heading font-bold text-primary mb-3">
                Bạn muốn tìm hiểu thêm về liệu trình chăm sóc da?
              </h3>
              <p className="text-muted-foreground mb-6">
                Đăng ký tư vấn miễn phí cùng đội ngũ chuyên gia của chúng tôi
                ngay hôm nay.
              </p>
              <Link
                to="/consultation"
                className="inline-block bg-accent text-accent-foreground px-8 py-3 rounded-full font-bold hover:brightness-110 transition-all shadow-lg hover:shadow-xl"
              >
                Đăng ký tư vấn
              </Link>
            </div>

            {/* Author Box */}
            <div className="mt-16 p-8 bg-card rounded-3xl border border-border flex flex-col sm:flex-row gap-6 items-center sm:items-start shadow-sm">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-heading text-xl font-bold mb-2">
                  Đội ngũ Admin
                </h4>
                <p className="text-muted-foreground mb-4">
                  Chuyên gia tư vấn da liễu và trẻ hóa làn da, mang
                  đến những thông tin chính xác và cập nhật nhất đối với sức khỏe làn da của bạn.
                </p>
                <Link
                  to="/about"
                  className="text-accent font-semibold hover:underline"
                >
                  Xem thêm bài viết của tác giả
                </Link>
              </div>
            </div>

            {/* Comment Section Placeholder */}
            <div className="mt-16">
              <h3 className="text-2xl font-heading font-bold mb-6">
                Bình luận (0)
              </h3>
              <div className="p-8 border border-dashed border-border rounded-3xl text-center bg-muted/30">
                <p className="text-muted-foreground mb-4">
                  Vui lòng đăng nhập để để lại bình luận cho bài viết này.
                </p>
                <Link
                  to="/login"
                  className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium hover:brightness-110"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>
          </div>

          {/* Right Sidebar (Sticky) */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-28 space-y-10">
              {/* Share */}
              <div>
                <h4 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Chia sẻ bài viết
                </h4>
                <div className="flex gap-3">
                  <button className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center hover:bg-sky-700 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-10 h-10 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-border transition-colors relative"
                  >
                    <LinkIcon className="w-5 h-5" />
                    {copied && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* TOC */}
              {toc.length > 0 && (
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                  <h4 className="font-heading text-lg font-bold mb-4">
                    Mục lục
                  </h4>
                  <ul className="space-y-3">
                    {toc.map((t, i) => (
                      <li key={i}>
                        <a
                          href={`#${t.id}`}
                          className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium line-clamp-2"
                        >
                          {t.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      {relatedNews && relatedNews.length > 0 && (
        <div className="bg-muted/30 py-16 border-t border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <h3 className="font-heading text-3xl font-bold mb-10 text-center">
              Bài viết liên quan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedNews.map((rel) => {
                const cfgR = getCategoryConfig(rel.category);
                return (
                  <Link
                    key={rel.id}
                    to={`/${rel.slug}`}
                    className="group bg-card rounded-3xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {rel.thumbnail_url && (
                        <img
                          src={resolvePublicUploadsUrl(rel.thumbnail_url)}
                          alt={rel.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      )}
                      <div className="absolute top-4 left-4 z-10">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${cfgR.color}`}
                        >
                          {lang === "vi" ? cfgR.label : cfgR.labelEn}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-heading text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {rel.excerpt}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
