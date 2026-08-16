import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { newsService } from "@/api/blogService";
import { useStaffAuth } from "@/lib/AuthContext";
import { buildApiUrl, resolvePublicUploadsUrl, getToken, getBlogShareDomain } from "@/api/apiUrl";
import {
  BLOG_CONTENT_MEDIA_ACCEPT,
  BLOG_IMAGE_ACCEPT,
  BLOG_IMAGE_TYPE_HINT,
  isAllowedBlogContentMediaFile,
  isAllowedBlogImageFile,
} from "@/lib/blogUpload";
import { notify } from "@/lib/notify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AUTO_SAVE_INTERVAL_MS = 20000;
const AUTO_SAVE_KEY_PREFIX = "theraderma_news_editor_autosave_v1";
const TAG_SUGGESTIONS_KEY = "theraderma_news_editor_tags_v1";
const MEDIA_LIBRARY_KEY = "theraderma_news_media_library_v1";

const defaultForm = {
  id: null,
  enId: null,
  titleVi: "",
  titleEn: "",
  excerptVi: "",
  excerptEn: "",
  contentVi: "",
  contentEn: "",
  thumbnail_url: "",
  thumbnail_file: null,
  status: "draft",
  category: "news",
  is_featured: false,
  tags: [],
  seoTitleVi: "",
  seoTitleEn: "",
  seoDescriptionVi: "",
  seoDescriptionEn: "",
  scheduledAt: "",
};

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EDITOR_ASSET_URL_PATTERN =
  "(?:https?:\\/\\/[^\\s)\\]}]+|\\/uploads\\/[^\\s)\\]}]+)";

// Markdown caption/credit cannot contain raw |, ], or backslashes; escape them so the inline
// image syntax `![caption|credit](url)` parses unambiguously on the renderer.
function sanitizeImageMeta(value) {
  return String(value || "")
    .replace(/\r?\n/g, " ")
    .replace(/[\\\]|]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildImageMarkdown(captionRaw, creditRaw, url) {
  const caption = sanitizeImageMeta(captionRaw);
  const credit = sanitizeImageMeta(creditRaw);
  const altSegment = credit ? `${caption}|${credit}` : caption;
  return `![${altSegment}](${url})`;
}

// Strip clearly malformed image markdown so a partially-typed `![alt text](https://)` placeholder
// or a missing-bracket `![Bohmann 2` cannot leak as plain text on published articles.
function sanitizeContentMarkdown(value) {
  let out = String(value || "");
  if (!out) return out;

  // 1. `![alt](url)` with empty / placeholder url -> drop entirely.
  const imgRe = /!\[([^\]\n]*)\]\(([^)\n]*)\)/g;
  out = out.replace(imgRe, (match, alt, url) => {
    const trimmed = String(url || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\/?$/i.test(trimmed)) return "";
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/uploads/"))
      return "";
    return `![${String(alt || "").trim()}](${trimmed})`;
  });

  // 2. Orphan `![text` or `![text](` without closing tokens on the same line.
  out = out.replace(/!\[[^\]\n]*\([^)\n]*$/gm, "");
  out = out.replace(/!\[[^\]\n]*$/gm, "");

  // 3. Collapse ≥3 consecutive blank lines.
  out = out.replace(/\n{3,}/g, "\n\n");

  // Legacy renderer bug left literal "$1" lines in stored markdown.
  out = out.replace(/^\s*\$1\s*$/gm, "");

  return out;
}

function hasBrokenImageMarkdown(value) {
  const raw = String(value || "");
  if (!raw) return false;
  if (/!\[[^\]\n]*\]\(\s*\)/.test(raw)) return true;
  if (/!\[[^\]\n]*\]\(https?:\/\/?\)/i.test(raw)) return true;
  if (/!\[[^\]\n]*$/m.test(raw)) return true;
  if (/!\[[^\]\n]*\([^)\n]*$/m.test(raw)) return true;
  return false;
}

function markdownToHtml(value) {
  const safe = escapeHtml(sanitizeContentMarkdown(value));
  const withCodeBlocks = safe.replace(/```([\s\S]*?)```/g, (_match, code) => {
    return `<pre class=\"bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto\"><code>${code}</code></pre>`;
  });

  let html = withCodeBlocks
    .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")
    .replace(/^##\s+(.*)$/gm, "<h2>$1</h2>")
    .replace(/^#\s+(.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 rounded">$1</code>')
    .replace(
      new RegExp(`!\\[(.*?)\\]\\((${EDITOR_ASSET_URL_PATTERN})\\)`, "g"),
      (_match, alt, url) => {
        const [captionPart, creditPart] = String(alt || "").split("|");
        const caption = (captionPart || "").trim();
        const credit = (creditPart || "").trim();
        const safeAlt = caption || "";
        const captionHtml = caption
          ? `<figcaption class=\"text-center text-xs text-slate-500 mt-2\">${caption}${
              credit
                ? `<span class=\"block text-[10px] italic text-slate-400 mt-0.5\">Ảnh: ${credit}</span>`
                : ""
            }</figcaption>`
          : credit
            ? `<figcaption class=\"text-center text-[10px] italic text-slate-400 mt-2\">Ảnh: ${credit}</figcaption>`
            : "";
        const src = resolvePublicUploadsUrl(url) || url;
        return `<figure class=\"my-4\"><img src=\"${src}\" alt=\"${safeAlt}\" class=\"rounded-lg border w-full\" />${captionHtml}</figure>`;
      },
    )
    // Remove any leftover broken image markdown so it does not bleed into the preview.
    .replace(/!\[[^\]\n]*\]\([^)\n]*\)/g, "")
    .replace(/!\[[^\]\n]*$/gm, "")
    .replace(
      new RegExp(`\\[(.*?)\\]\\((${EDITOR_ASSET_URL_PATTERN})\\)`, "g"),
      '<a href="$2" target="_blank" rel="noreferrer" class="text-amber-600 underline">$1</a>',
    )
    .replace(
      new RegExp(`\\{\\{video:(${EDITOR_ASSET_URL_PATTERN})\\}\\}`, "g"),
      (_match, url) => {
        if (String(url).startsWith("/uploads/")) {
          return `<video class=\"w-full rounded-lg border\" src=\"${resolvePublicUploadsUrl(url) || url}\" controls playsinline></video>`;
        }
        return `<div class=\"aspect-video w-full\"><iframe class=\"w-full h-full rounded-lg\" src=\"${url}\" frameborder=\"0\" allowfullscreen></iframe></div>`;
      },
    )
    .replace(
      /\{\{cta:(.*?)\|(.*?)\}\}/g,
      '<div class="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center my-6"><h4 class="text-lg font-bold text-amber-800 mb-4">$1</h4><a href="$2" class="inline-block bg-amber-500 text-white px-6 py-2 rounded-full font-bold">Đăng ký ngay</a></div>',
    )
    .replace(
      /\{\{highlight:(.*?)\}\}/g,
      '<div class="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg my-6 text-emerald-900 font-medium">$1</div>',
    );

  html = html
    .split(/\n\s*\n/)
    .map((block) => {
      const trimmed = block.trim();
      if (
        trimmed.startsWith('<div class="p-') ||
        trimmed.startsWith('<div class="aspect-video') ||
        trimmed.startsWith("<pre") ||
        trimmed.startsWith("<img") ||
        trimmed.startsWith("<figure")
      ) {
        return block;
      }
      if (!trimmed) return "";
      return `<p>${block.replace(/\n/g, "<br />")}</p>`;
    })
    .join("");

  return html;
}

function countWords(value) {
  const plain = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .trim();
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function storeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function mergeTags(tags) {
  const normalized = Array.isArray(tags) ? tags : [];
  const seen = new Set();
  const result = [];
  for (const tag of normalized) {
    const clean = String(tag || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

export default function AdminNewsEditor() {
  const { user } = useStaffAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const newsId = searchParams.get("id");
  const isEditing = Boolean(newsId);
  const isApprovalAdmin =
    user?.role === "admin" || user?.role === "staff" || user?.role === "super_admin";
  const isContentAdmin = user?.role === "content_admin";
  const canPublishDirect =
    isApprovalAdmin || isContentAdmin || Boolean(user?.canPublishNews);
  const backPath = "/admin/newsroom/articles";
  const [activeLang, setActiveLang] = useState("vi");
  const [showPreview, setShowPreview] = useState(true);
  const [translateDialogOpen, setTranslateDialogOpen] = useState(false);
  const [translateTargetLang, setTranslateTargetLang] = useState("en");

  const [form, setForm] = useState(() => ({
    ...defaultForm,
    status: canPublishDirect ? "published" : "draft",
  }));
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [thumbnailCropRatio, setThumbnailCropRatio] = useState("16:9");
  const [autosaveInfo, setAutosaveInfo] = useState(null);
  const [autosaveCandidate, setAutosaveCandidate] = useState(null);
  const [tagSuggestions, setTagSuggestions] = useState(() =>
    getStoredJson(TAG_SUGGESTIONS_KEY, []),
  );
  const [mediaLibrary, setMediaLibrary] = useState(() =>
    getStoredJson(MEDIA_LIBRARY_KEY, []),
  );
  const [mediaUploading, setMediaUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [imageDialog, setImageDialog] = useState(
    /** @type {null | { mode: 'insert' | 'upload-pending'; caption: string; credit: string; url: string; file: File | null; uploading: boolean; error: string }} */ (
      null
    ),
  );

  const formRef = useRef(form);
  const editorViRef = useRef(null);
  const editorEnRef = useRef(null);
  const contentMediaInputRef = useRef(null);
  const dialogFileInputRef = useRef(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    formRef.current = form;
    dirtyRef.current = true;
  }, [form]);

  useEffect(() => {
    if (searchParams.get("translate") === "1") {
      setTranslateDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const key = `${AUTO_SAVE_KEY_PREFIX}:${newsId || "new"}`;
    const cached = getStoredJson(key, null);
    if (cached?.form) {
      setAutosaveCandidate(cached);
    }
  }, [newsId]);

  useEffect(() => {
    if (!newsId) return;

    const load = async () => {
      try {
        setLoading(true);
        const viRes = await newsService.getNewsById(newsId, {
          lang: "vi",
          auth: true,
        });

        let enRes = null;
        try {
          enRes = await newsService.getEnglishByVietnameseId(newsId);
        } catch (error) {
          enRes = null;
        }

        setForm({
          id: viRes.data.id,
          enId: enRes?.data?.id ?? null,
          titleVi: viRes.data.title ?? "",
          titleEn: enRes?.data?.title ?? "",
          excerptVi: viRes.data.excerpt ?? "",
          excerptEn: enRes?.data?.excerpt ?? "",
          contentVi: viRes.data.content ?? "",
          contentEn: enRes?.data?.content ?? "",
          thumbnail_url: viRes.data.thumbnail_url ?? "",
          status: viRes.data.status ?? "draft",
          category: viRes.data.category ?? "news",
          is_featured: Boolean(viRes.data.is_featured),
          tags: mergeTags(viRes.data.tags || []),
          seoTitleVi: viRes.data.seo_title ?? "",
          seoTitleEn: enRes?.data?.seo_title ?? "",
          seoDescriptionVi: viRes.data.seo_description ?? "",
          seoDescriptionEn: enRes?.data?.seo_description ?? "",
          scheduledAt: toDatetimeLocal(viRes.data.scheduled_at),
          thumbnail_file: null,
        });
      } catch (error) {
        console.error("Load news failed:", error);
        notify.error({ title: "Không thể tải dữ liệu bài viết" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [newsId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!dirtyRef.current) return;
      const key = `${AUTO_SAVE_KEY_PREFIX}:${newsId || "new"}`;
      const payload = {
        savedAt: Date.now(),
        form: {
          ...formRef.current,
          thumbnail_file: null,
        },
      };
      storeJson(key, payload);
      setAutosaveInfo(payload.savedAt);
      dirtyRef.current = false;
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [newsId]);

  useEffect(() => {
    if (form.thumbnail_file) {
      const url = URL.createObjectURL(form.thumbnail_file);
      setThumbnailPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (form.thumbnail_url) {
      setThumbnailPreviewUrl(
        resolvePublicUploadsUrl(form.thumbnail_url) || form.thumbnail_url,
      );
      return undefined;
    }
    setThumbnailPreviewUrl("");
    return undefined;
  }, [form.thumbnail_file, form.thumbnail_url]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateTags = (nextTags) => {
    updateField("tags", mergeTags(nextTags));
  };

  const addTagFromInput = () => {
    const next = mergeTags([...(form.tags || []), tagInput]);
    if (next.length === (form.tags || []).length) return;
    updateTags(next);
    setTagInput("");
  };

  const handleTagKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTagFromInput();
    }
  };

  const persistSuggestions = (tags) => {
    const merged = mergeTags([...(tagSuggestions || []), ...tags]);
    setTagSuggestions(merged);
    storeJson(TAG_SUGGESTIONS_KEY, merged);
  };

  const persistMediaLibrary = (url) => {
    if (!url) return;
    const merged = mergeTags([url, ...(mediaLibrary || [])]);
    setMediaLibrary(merged);
    storeJson(MEDIA_LIBRARY_KEY, merged);
  };

  const applyCenterCrop = async (ratioValue) => {
    if (!form.thumbnail_file) return;
    const ratio = ratioValue === "1:1" ? 1 : 16 / 9;
    const file = form.thumbnail_file;
    const img = new Image();
    const url = URL.createObjectURL(file);

    const imageLoaded = new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    img.src = url;
    try {
      await imageLoaded;
      const srcRatio = img.width / img.height;
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;

      if (srcRatio > ratio) {
        sw = img.height * ratio;
        sx = (img.width - sw) / 2;
      } else if (srcRatio < ratio) {
        sh = img.width / ratio;
        sy = (img.height - sh) / 2;
      }

      const targetWidth = 1200;
      const targetHeight = Math.round(targetWidth / ratio);
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Center crop to keep the focal point without manual drag.
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) return;
      const croppedFile = new File(
        [blob],
        file.name.replace(/\.(\w+)$/, "_crop.$1"),
        { type: "image/jpeg" },
      );
      updateField("thumbnail_file", croppedFile);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const insertIntoEditor = (value) => {
    const ref = activeLang === "vi" ? editorViRef : editorEnRef;
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const current = activeLang === "vi" ? form.contentVi : form.contentEn;
    const next = `${current.slice(0, start)}${value}${current.slice(end)}`;
    if (activeLang === "vi") {
      updateField("contentVi", next);
    } else {
      updateField("contentEn", next);
    }
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + value.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const appendSharedMedia = (current, value) => {
    const existing = String(current || "");
    const media = String(value || "").trimEnd();
    if (!media || existing.includes(media)) return existing;
    if (!existing.trim()) return `${media}\n`;
    return `${existing}${existing.endsWith("\n") ? "" : "\n"}${media}\n`;
  };

  const insertMediaIntoBothEditors = (value) => {
    const ref = activeLang === "vi" ? editorViRef : editorEnRef;
    const el = ref.current;
    const activeField = activeLang === "vi" ? "contentVi" : "contentEn";
    const inactiveField = activeLang === "vi" ? "contentEn" : "contentVi";
    const start = el?.selectionStart ?? null;
    const end = el?.selectionEnd ?? null;

    setForm((prev) => {
      const activeContent = String(prev[activeField] || "");
      const inactiveContent = String(prev[inactiveField] || "");
      const nextActive =
        start === null || end === null
          ? appendSharedMedia(activeContent, value)
          : `${activeContent.slice(0, start)}${value}${activeContent.slice(end)}`;

      return {
        ...prev,
        [activeField]: nextActive,
        [inactiveField]: appendSharedMedia(inactiveContent, value),
      };
    });

    if (el && start !== null) {
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + value.length;
        el.setSelectionRange(pos, pos);
      });
    }
  };

  const applyFormat = (type) => {
    switch (type) {
      case "bold":
        return insertIntoEditor("**bold text**");
      case "italic":
        return insertIntoEditor("*italic text*");
      case "h1":
        return insertIntoEditor("# Heading 1\n");
      case "h2":
        return insertIntoEditor("## Heading 2\n");
      case "quote":
        return insertIntoEditor("> Quote\n");
      case "code":
        return insertIntoEditor("```\ncode block\n```\n");
      case "link":
        return insertIntoEditor("[link text](https://)");
      case "image":
        setImageDialog({
          mode: "insert",
          caption: "",
          credit: "",
          url: "",
          file: null,
          uploading: false,
          error: "",
        });
        return undefined;
      case "video":
        return insertIntoEditor("{{video:https://}}\n");
      case "cta":
        return insertIntoEditor("{{cta:Tiêu đề CTA|https://}}\n");
      case "highlight":
        return insertIntoEditor("{{highlight:Nội dung nổi bật}}\n");
      default:
        return undefined;
    }
  };

  const uploadContentMedia = async (file) => {
    const token = getToken();
    if (!token) {
      notify.error({
        title:
          "PhiÃªn Ä‘Äƒng nháº­p Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i.",
      });
      return;
    }

    if (!isAllowedBlogContentMediaFile(file)) {
      notify.error({
        title: "File không hợp lệ",
        description: `Chỉ hỗ trợ ảnh (${BLOG_IMAGE_TYPE_HINT}) hoặc video MP4/WEBM/MOV.`,
      });
      return;
    }

    const maxSize = file.type.startsWith("video/")
      ? 300 * 1024 * 1024
      : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      notify.error({
        title: "File quÃ¡ lá»›n",
        description: file.type.startsWith("video/")
          ? "Video tá»‘i Ä‘a 300MB."
          : "áº¢nh tá»‘i Ä‘a 10MB.",
      });
      return;
    }

    try {
      setMediaUploading(true);
      const formData = new FormData();
      formData.append("media", file);
      const response = await fetch(buildApiUrl('/upload/blog-media'), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            `Upload failed: ${response.status}`,
        );
      }

      const url = payload?.data?.url;
      const type =
        payload?.data?.type ||
        (file.type.startsWith("video/") ? "video" : "image");
      if (!url) {
        throw new Error("Upload khÃ´ng tráº£ vá» URL media");
      }

      if (type === "video") {
        insertMediaIntoBothEditors(`{{video:${url}}}\n`);
        notify.success({ title: "Đã upload video" });
      } else {
        persistMediaLibrary(url);
        setImageDialog({
          mode: "insert",
          caption: file.name.replace(/\.[^.]+$/, ""),
          credit: "",
          url,
          file: null,
          uploading: false,
          error: "",
        });
      }
    } catch (error) {
      console.error("Content media upload failed:", error);
      notify.error({
        title: "KhÃ´ng thá»ƒ upload media",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setMediaUploading(false);
      if (contentMediaInputRef.current) {
        contentMediaInputRef.current.value = "";
      }
    }
  };

  const uploadMediaFile = async (file) => {
    const token = getToken();
    if (!token) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    const formData = new FormData();
    formData.append("media", file);
    const response = await fetch(buildApiUrl('/upload/blog-media'), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(
        payload?.error ||
          payload?.message ||
          `Upload failed: ${response.status}`,
      );
    }
    const url = payload?.data?.url;
    if (!url) {
      throw new Error("Upload không trả về URL media");
    }
    return { url, type: payload?.data?.type || "image" };
  };

  const closeImageDialog = () => {
    setImageDialog(null);
    if (dialogFileInputRef.current) dialogFileInputRef.current.value = "";
  };

  const handleDialogFilePicked = (file) => {
    if (!file) return;
    if (!isAllowedBlogImageFile(file)) {
      setImageDialog((prev) =>
        prev ? { ...prev, error: `Chỉ hỗ trợ ${BLOG_IMAGE_TYPE_HINT}.` } : prev,
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageDialog((prev) =>
        prev ? { ...prev, error: "Ảnh tối đa 10MB." } : prev,
      );
      return;
    }
    setImageDialog((prev) =>
      prev
        ? {
            ...prev,
            file,
            url: "",
            caption: prev.caption || file.name.replace(/\.[^.]+$/, ""),
            error: "",
          }
        : prev,
    );
  };

  const submitImageDialog = async () => {
    if (!imageDialog) return;
    const { caption, credit } = imageDialog;
    let finalUrl = String(imageDialog.url || "").trim();

    setImageDialog((prev) =>
      prev ? { ...prev, uploading: true, error: "" } : prev,
    );

    try {
      if (imageDialog.file) {
        const { url } = await uploadMediaFile(imageDialog.file);
        finalUrl = url;
        persistMediaLibrary(url);
      } else if (!finalUrl) {
        setImageDialog((prev) =>
          prev
            ? {
                ...prev,
                uploading: false,
                error: "Hãy upload ảnh hoặc nhập URL.",
              }
            : prev,
        );
        return;
      } else if (
        !/^https?:\/\//i.test(finalUrl) &&
        !finalUrl.startsWith("/uploads/")
      ) {
        setImageDialog((prev) =>
          prev
            ? {
                ...prev,
                uploading: false,
                error: "URL phải bắt đầu bằng http(s):// hoặc /uploads/.",
              }
            : prev,
        );
        return;
      } else {
        persistMediaLibrary(finalUrl);
      }

      const markdown = `${buildImageMarkdown(caption, credit, finalUrl)}\n`;
      insertMediaIntoBothEditors(markdown);
      notify.success({
        title: imageDialog.file ? "Đã upload và chèn ảnh" : "Đã chèn ảnh",
      });
      closeImageDialog();
    } catch (error) {
      console.error("Image insert failed:", error);
      setImageDialog((prev) =>
        prev
          ? {
              ...prev,
              uploading: false,
              error:
                error instanceof Error ? error.message : "Không thể chèn ảnh",
            }
          : prev,
      );
    }
  };

  const handleTranslate = async () => {
    const from = activeLang === "en" ? "en" : "vi";
    const to = translateTargetLang === "vi" ? "vi" : "en";
    if (from === to) {
      notify.error({ title: "Ngôn ngữ nguồn và đích trùng nhau" });
      return;
    }

    const source = {
      title: from === "vi" ? form.titleVi : form.titleEn,
      excerpt: from === "vi" ? form.excerptVi : form.excerptEn,
      content: from === "vi" ? form.contentVi : form.contentEn,
      seoTitle: from === "vi" ? form.seoTitleVi : form.seoTitleEn,
      seoDescription: from === "vi" ? form.seoDescriptionVi : form.seoDescriptionEn,
    };
    const hasSource = Object.values(source).some(
      (v) => typeof v === "string" && v.trim(),
    );
    if (!hasSource) {
      notify.error({
        title:
          from === "vi"
            ? "Chưa có nội dung Tiếng Việt để dịch"
            : "Chưa có nội dung English để dịch",
      });
      return;
    }

    const hasTargetDraft =
      to === "vi"
        ? Boolean(
            form.titleVi?.trim() ||
              form.excerptVi?.trim() ||
              form.contentVi?.trim() ||
              form.seoTitleVi?.trim() ||
              form.seoDescriptionVi?.trim(),
          )
        : Boolean(
            form.titleEn?.trim() ||
              form.excerptEn?.trim() ||
              form.contentEn?.trim() ||
              form.seoTitleEn?.trim() ||
              form.seoDescriptionEn?.trim(),
          );

    if (
      hasTargetDraft &&
      !window.confirm(
        "Nội dung ngôn ngữ đích hiện tại sẽ được thay bằng bản dịch mới. Tiếp tục?",
      )
    ) {
      return;
    }

    const token = getToken();
    if (!token) {
      notify.error({
        title: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      });
      return;
    }

    try {
      setTranslating(true);
      const response = await fetch(buildApiUrl('/blog-posts/translate'), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...source, from, to }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        const apiMessage =
          (typeof payload?.message === "string" && payload.message) ||
          (Array.isArray(payload?.message) && payload.message.join(", ")) ||
          (typeof payload?.error === "string" && payload.error) ||
          `Translate failed: ${response.status}`;
        throw new Error(apiMessage);
      }

      const data = payload?.data || {};
      setForm((prev) => {
        if (to === "vi") {
          return {
            ...prev,
            titleVi: String(data.title || ""),
            excerptVi: String(data.excerpt || ""),
            contentVi: String(data.content || ""),
            seoTitleVi: String(data.seoTitle || ""),
            seoDescriptionVi: String(data.seoDescription || ""),
          };
        }
        return {
          ...prev,
          titleEn: String(data.title || ""),
          excerptEn: String(data.excerpt || ""),
          contentEn: String(data.content || ""),
          seoTitleEn: String(data.seoTitle || ""),
          seoDescriptionEn: String(data.seoDescription || ""),
        };
      });
      setActiveLang(to);
      setTranslateDialogOpen(false);
      notify.success({
        title: to === "vi" ? "Đã dịch sang Tiếng Việt" : "Đã dịch sang English",
      });
    } catch (error) {
      console.error("Translate failed:", error);
      notify.error({
        title: "Không thể dịch",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setTranslating(false);
    }
  };

  const resolveEditorValue = () =>
    activeLang === "vi" ? form.contentVi : form.contentEn;
  const resolveTitleValue = () =>
    activeLang === "vi" ? form.titleVi : form.titleEn;
  const resolveExcerptValue = () =>
    activeLang === "vi" ? form.excerptVi : form.excerptEn;
  const resolveSeoTitleValue = () =>
    activeLang === "vi" ? form.seoTitleVi : form.seoTitleEn;
  const resolveSeoDescriptionValue = () =>
    activeLang === "vi" ? form.seoDescriptionVi : form.seoDescriptionEn;

  const wordCount = useMemo(
    () => countWords(resolveEditorValue()),
    [form.contentVi, form.contentEn, activeLang],
  );
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      updateField("thumbnail_file", file);
    }
  };

  const preparePayload = async (nextStatus) => {
    const cleanedContentVi = sanitizeContentMarkdown(form.contentVi);
    const cleanedContentEn = sanitizeContentMarkdown(form.contentEn);
    if (
      cleanedContentVi !== form.contentVi ||
      cleanedContentEn !== form.contentEn
    ) {
      setForm((prev) => ({
        ...prev,
        contentVi: cleanedContentVi,
        contentEn: cleanedContentEn,
      }));
      notify.info({
        title: "Đã dọn markdown ảnh lỗi",
        description:
          "Một số đoạn markdown ảnh không hợp lệ đã được tự động loại bỏ.",
      });
    }

    let thumbnailUrl = form.thumbnail_url;

    if (form.thumbnail_file) {
      const token = getToken();
      if (!token) {
        notify.error({
          title: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        });
        return null;
      }
      const formData = new FormData();
      formData.append("image", form.thumbnail_file);
      const response = await fetch(buildApiUrl('/upload/blog-thumbnail'), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            `Upload failed: ${response.status}`,
        );
      }
      thumbnailUrl = payload?.data?.url || thumbnailUrl;
      persistMediaLibrary(thumbnailUrl);
    }

    const scheduledAtValue =
      nextStatus === "scheduled" && form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : null;

    const basePayload = {
      thumbnail_url: thumbnailUrl,
      status: nextStatus,
      category: form.category,
      is_featured: form.is_featured,
      tags: form.tags,
      scheduled_at: scheduledAtValue,
    };

    return {
      vi: {
        ...basePayload,
        title: form.titleVi,
        excerpt: form.excerptVi,
        content: cleanedContentVi,
        seo_title: form.seoTitleVi,
        seo_description: form.seoDescriptionVi,
      },
      en: {
        ...basePayload,
        title: form.titleEn,
        excerpt: form.excerptEn,
        content: cleanedContentEn,
        seo_title: form.seoTitleEn,
        seo_description: form.seoDescriptionEn,
      },
    };
  };

  const handleSubmit = async (overrideStatus) => {
    if (!form.titleVi || !form.titleEn || !form.contentVi || !form.contentEn) {
      notify.error({
        title: "Thiếu nội dung",
        description: "Vui lòng nhập đầy đủ tiêu đề và nội dung cho cả VI/EN.",
      });
      return;
    }

    const nextStatus = overrideStatus || form.status;
    if (nextStatus === "scheduled" && !form.scheduledAt) {
      notify.error({
        title: "Chưa chọn thời gian",
        description: "Vui lòng chọn lịch đăng bài.",
      });
      return;
    }

    try {
      setLoading(true);
      const payload = await preparePayload(nextStatus);
      if (!payload) return;

      if (isEditing && form.id) {
        await newsService.updateNews(form.id, payload.vi);

        if (form.enId) {
          await newsService.updateEnglishNews(form.enId, payload.en);
        } else {
          await newsService.createEnglishNews({
            ...payload.en,
            news_vi_id: form.id,
          });
        }
      } else {
        await newsService.createBilingualNews({
          vi: payload.vi,
          en: payload.en,
        });
      }

      persistSuggestions(form.tags);
      notify.success({ title: isEditing ? "Đã cập nhật" : "Đã tạo bài viết" });
      navigate(backPath);
    } catch (error) {
      console.error("Save failed:", error);
      notify.error({ title: "Không thể lưu bài viết" });
    } finally {
      setLoading(false);
    }
  };

  const editorValue = resolveEditorValue();
  const previewHtml = useMemo(() => markdownToHtml(editorValue), [editorValue]);
  const seoTitle = resolveSeoTitleValue() || resolveTitleValue();
  const seoDescription = resolveSeoDescriptionValue() || resolveExcerptValue();
  const shareDomain = getBlogShareDomain();
  const slugPreview = slugify(resolveTitleValue()) || "new-article";

  const statusBadgeTone =
    {
      draft: "bg-muted text-muted-foreground",
      pending: "bg-amber-500/15 text-amber-700",
      published: "bg-emerald-500/15 text-emerald-700",
      scheduled: "bg-sky-500/15 text-sky-700",
      archived: "bg-muted text-muted-foreground",
    }[form.status] || "bg-muted text-muted-foreground";

  return (
    <div className="pt-14 lg:pt-16 min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="sticky top-20 z-10 -mx-4 lg:-mx-6 px-4 lg:px-6 mb-5">
          <div className="rounded-xl border border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-sm hover:bg-muted/40"
                  onClick={() => navigate(backPath)}
                >
                  ← Back
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {isEditing
                      ? form.titleVi || form.titleEn || "Editing article"
                      : "New article"}
                  </div>
                  <div className="text-[11px] text-muted-foreground inline-flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${statusBadgeTone}`}
                    >
                      {form.status}
                    </span>
                    <span>
                      {wordCount} words • ~{readingMinutes} min
                    </span>
                    {autosaveInfo ? (
                      <span>
                        • Auto-save{" "}
                        {new Date(autosaveInfo).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview((prev) => !prev)}
                  className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-sm hover:bg-muted/40"
                >
                  {showPreview ? "Hide preview" : "Show preview"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaultTarget = activeLang === "vi" ? "en" : "vi";
                    setTranslateTargetLang(defaultTarget);
                    setTranslateDialogOpen(true);
                  }}
                  disabled={translating}
                  className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-sm hover:bg-muted/40 disabled:opacity-60"
                >
                  {translating ? "Translating…" : "Translate…"}
                </button>
                <button
                  type="button"
                  className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-sm hover:bg-muted/40"
                  onClick={() => handleSubmit("draft")}
                  disabled={loading}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleSubmit(
                      form.status === "scheduled" ? "scheduled" : "published",
                    )
                  }
                  className="h-9 px-4 rounded-md bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 disabled:opacity-60"
                >
                  {loading
                    ? "Saving…"
                    : form.status === "scheduled"
                      ? "Schedule publish"
                      : form.status === "pending"
                        ? "Publish"
                        : isEditing
                          ? "Publish"
                          : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {autosaveCandidate ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-3">
            <div>
              Có bản nháp tự động từ{" "}
              {new Date(autosaveCandidate.savedAt).toLocaleString("vi-VN")}.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border text-xs"
                onClick={() => setAutosaveCandidate(null)}
              >
                Bỏ
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    ...(autosaveCandidate.form || {}),
                  }));
                  setAutosaveCandidate(null);
                  notify.success({ title: "Đã phục hồi bản nháp" });
                }}
              >
                Phục hồi
              </button>
            </div>
          </div>
        ) : null}

        <Dialog open={translateDialogOpen} onOpenChange={setTranslateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dịch nội dung</DialogTitle>
              <DialogDescription>
                Chọn ngôn ngữ đích để dịch từ tab hiện tại.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <div className="text-sm font-semibold">
                Nguồn: {activeLang === "vi" ? "Tiếng Việt" : "English"}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ngôn ngữ đích
                </div>
                <Select
                  value={translateTargetLang}
                  onValueChange={setTranslateTargetLang}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngôn ngữ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <button
                type="button"
                className="h-9 px-3 inline-flex items-center justify-center rounded-md border border-border text-sm"
                onClick={() => setTranslateDialogOpen(false)}
                disabled={translating}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="h-9 px-4 inline-flex items-center justify-center rounded-md bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-60"
                onClick={handleTranslate}
                disabled={translating}
              >
                {translating ? "Đang dịch…" : "Dịch"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="inline-flex items-center rounded-md bg-muted/50 p-0.5">
                    {["vi", "en"].map((lang) => {
                      const active = activeLang === lang;
                      const hasContent =
                        lang === "vi"
                          ? Boolean(form.titleVi || form.contentVi)
                          : Boolean(form.titleEn || form.contentEn);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setActiveLang(lang)}
                          className={`relative px-3 h-8 inline-flex items-center gap-1.5 rounded-md text-xs font-semibold transition-colors ${
                            active
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {lang === "vi" ? "Tiếng Việt" : "English"}
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              hasContent
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/40"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Slug:{" "}
                      <code className="px-1 py-0.5 rounded bg-muted text-foreground">
                        {slugPreview}
                      </code>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Title
                      </label>
                      <input
                        className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder={
                          activeLang === "vi"
                            ? "Tiêu đề Tiếng Việt"
                            : "Title English"
                        }
                        value={resolveTitleValue()}
                        onChange={(e) =>
                          updateField(
                            activeLang === "vi" ? "titleVi" : "titleEn",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Excerpt
                      </label>
                      <textarea
                        className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        rows={2}
                        placeholder={
                          activeLang === "vi"
                            ? "Mô tả Tiếng Việt"
                            : "Excerpt English"
                        }
                        value={resolveExcerptValue()}
                        onChange={(e) =>
                          updateField(
                            activeLang === "vi" ? "excerptVi" : "excerptEn",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Embed media
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Upload ảnh/video trực tiếp rồi chèn vào nội dung. Vẫn có
                      thể chèn link khi cần.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        ref={contentMediaInputRef}
                        type="file"
                        accept={BLOG_CONTENT_MEDIA_ACCEPT}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadContentMedia(file);
                        }}
                      />
                      <button
                        type="button"
                        className="h-8 px-3 inline-flex items-center rounded-md border border-border text-xs bg-background hover:bg-muted/40 disabled:opacity-60"
                        onClick={() => contentMediaInputRef.current?.click()}
                        disabled={mediaUploading}
                      >
                        {mediaUploading ? "Uploading…" : "Upload file"}
                      </button>
                      <button
                        type="button"
                        className="h-8 px-3 inline-flex items-center rounded-md border border-border text-xs hover:bg-muted/40"
                        onClick={() => applyFormat("image")}
                      >
                        Image
                      </button>
                      <button
                        type="button"
                        className="h-8 px-3 inline-flex items-center rounded-md border border-border text-xs hover:bg-muted/40"
                        onClick={() => applyFormat("video")}
                      >
                        Video
                      </button>
                      <button
                        type="button"
                        className="h-8 px-3 inline-flex items-center rounded-md border border-border text-xs hover:bg-muted/40"
                        onClick={() => applyFormat("link")}
                      >
                        Link
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className={`grid ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"} gap-4`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <ToolbarBtn
                        label="H1"
                        onClick={() => applyFormat("h1")}
                      />
                      <ToolbarBtn
                        label="H2"
                        onClick={() => applyFormat("h2")}
                      />
                      <ToolbarBtn
                        label="B"
                        bold
                        onClick={() => applyFormat("bold")}
                      />
                      <ToolbarBtn
                        label="I"
                        italic
                        onClick={() => applyFormat("italic")}
                      />
                      <ToolbarBtn
                        label="Quote"
                        onClick={() => applyFormat("quote")}
                      />
                      <ToolbarBtn
                        label="Code"
                        onClick={() => applyFormat("code")}
                      />
                      <ToolbarBtn
                        label="CTA"
                        tone="accent"
                        onClick={() => applyFormat("cta")}
                      />
                      <ToolbarBtn
                        label="Highlight"
                        tone="success"
                        onClick={() => applyFormat("highlight")}
                      />
                    </div>
                    <textarea
                      ref={activeLang === "vi" ? editorViRef : editorEnRef}
                      className="min-h-[420px] w-full border border-border rounded-lg px-4 py-3 text-sm leading-relaxed bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                      placeholder={
                        activeLang === "vi"
                          ? "Viết nội dung ở đây (Markdown)"
                          : "Write content here (Markdown)"
                      }
                      value={editorValue}
                      onChange={(e) =>
                        updateField(
                          activeLang === "vi" ? "contentVi" : "contentEn",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  {showPreview ? (
                    <div className="border border-border rounded-lg bg-background p-4 overflow-auto">
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html:
                            previewHtml ||
                            '<p class="text-muted-foreground">Chưa có nội dung.</p>',
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <AiSeoPanel
                title={resolveTitleValue()}
                excerpt={resolveExcerptValue()}
                content={editorValue}
                seoTitle={seoTitle}
                seoDescription={seoDescription}
                hasEnglish={Boolean(form.titleEn && form.contentEn)}
                hasFeatured={form.is_featured}
              />
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Metadata</h2>
                  {autosaveInfo ? (
                    <span className="text-[10px] text-muted-foreground">
                      Saved{" "}
                      {new Date(autosaveInfo).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </label>
                  <select
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    {!canPublishDirect ? (
                      <option value="pending">Pending review</option>
                    ) : null}
                    {canPublishDirect ? (
                      <option value="published">Published</option>
                    ) : null}
                    {canPublishDirect ? (
                      <option value="scheduled">Scheduled</option>
                    ) : null}
                    {isApprovalAdmin ? (
                      <option value="archived">Archived</option>
                    ) : null}
                  </select>
                  {form.status === "scheduled" ? (
                    <input
                      type="datetime-local"
                      className="mt-2 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                      value={form.scheduledAt}
                      onChange={(e) =>
                        updateField("scheduledAt", e.target.value)
                      }
                    />
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Category
                  </label>
                  <select
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                  >
                    <option value="news">Tin tức</option>
                    <option value="announcement">Thông báo</option>
                    <option value="scholarship">Học bổng</option>
                    <option value="event">Sự kiện</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(form.tags || []).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          updateTags(form.tags.filter((t) => t !== tag))
                        }
                        className="px-2 py-1 rounded-full bg-slate-100 text-xs"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  <input
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Nhập tag và nhấn Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  {tagSuggestions.length ? (
                    <div className="flex flex-wrap gap-2">
                      {tagSuggestions.slice(0, 8).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="px-2 py-1 rounded-full border border-border text-xs text-muted-foreground hover:bg-muted/40"
                          onClick={() =>
                            updateTags([...(form.tags || []), tag])
                          }
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Featured
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) =>
                        updateField("is_featured", e.target.checked)
                      }
                      disabled={!isApprovalAdmin}
                    />
                    Hiển thị ở khu vực nổi bật (homepage/banner)
                  </label>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Thumbnail</h2>
                  <select
                    className="border border-border rounded-md px-2 py-1 text-xs bg-background"
                    value={thumbnailCropRatio}
                    onChange={(e) => setThumbnailCropRatio(e.target.value)}
                  >
                    <option value="16:9">16:9</option>
                    <option value="1:1">1:1</option>
                  </select>
                </div>

                <div
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground bg-muted/30"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  Kéo thả ảnh vào đây hoặc chọn file
                  <input
                    type="file"
                    accept={BLOG_IMAGE_ACCEPT}
                    className="mt-3 w-full text-xs"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateField("thumbnail_file", file);
                    }}
                  />
                </div>

                {thumbnailPreviewUrl ? (
                  <div className="rounded-lg overflow-hidden border border-border bg-muted">
                    <img
                      src={thumbnailPreviewUrl}
                      alt="preview"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-8 px-3 inline-flex items-center rounded-md border border-border text-xs hover:bg-muted/40 disabled:opacity-50"
                    onClick={() => applyCenterCrop(thumbnailCropRatio)}
                    disabled={!form.thumbnail_file}
                  >
                    Crop (center)
                  </button>
                  <button
                    type="button"
                    className="h-8 px-3 inline-flex items-center rounded-md border border-border text-xs hover:bg-muted/40"
                    onClick={() => updateField("thumbnail_file", null)}
                  >
                    Reset
                  </button>
                </div>

                {mediaLibrary.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Media library
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {mediaLibrary.slice(0, 8).map((url) => (
                        <button
                          key={url}
                          type="button"
                          className="rounded-md overflow-hidden border border-border hover:border-foreground/30"
                          onClick={() => {
                            updateField("thumbnail_url", url);
                            updateField("thumbnail_file", null);
                          }}
                        >
                          <img
                            src={resolvePublicUploadsUrl(url) || url}
                            alt="media"
                            className="w-full h-14 object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h2 className="font-semibold">SEO & social preview</h2>
                <input
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  placeholder="SEO title"
                  value={resolveSeoTitleValue()}
                  onChange={(e) =>
                    updateField(
                      activeLang === "vi" ? "seoTitleVi" : "seoTitleEn",
                      e.target.value,
                    )
                  }
                />
                <textarea
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  rows={3}
                  placeholder="SEO description"
                  value={resolveSeoDescriptionValue()}
                  onChange={(e) =>
                    updateField(
                      activeLang === "vi"
                        ? "seoDescriptionVi"
                        : "seoDescriptionEn",
                      e.target.value,
                    )
                  }
                />

                <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border">
                  Primary keyword density:{" "}
                  <span className="font-bold text-accent">
                    {resolveTitleValue()
                      ? resolveEditorValue().match(
                          new RegExp(resolveTitleValue().split(" ")[0], "gi"),
                        )?.length || 0
                      : 0}
                    × repeats
                  </span>
                </div>

                <div className="border border-[#dadde1] rounded-lg bg-[#f0f2f5] overflow-hidden w-full max-w-full">
                  <div className="h-[200px] bg-[#e4e6eb] w-full border-b border-[#dadde1] overflow-hidden">
                    {thumbnailPreviewUrl ? (
                      <img
                        src={thumbnailPreviewUrl}
                        className="w-full h-full object-cover"
                        alt="og-preview"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-[#f0f2f5]">
                    <p className="text-[12px] text-[#606770] uppercase tracking-wider">
                      {shareDomain}
                    </p>
                    <p className="text-[14px] font-semibold text-[#1d2129] mt-1 leading-tight line-clamp-2">
                      {seoTitle || "SEO title shown when shared"}
                    </p>
                    <p className="text-[12px] text-[#606770] mt-1 line-clamp-2">
                      {seoDescription ||
                        "SEO description appears here on Facebook share."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {imageDialog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeImageDialog();
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Chèn ảnh vào bài</h3>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground text-sm"
                onClick={closeImageDialog}
              >
                Đóng
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tên ảnh / caption
              </label>
              <input
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                placeholder="VD: Liệu trình chăm sóc da tại Thera Derma"
                value={imageDialog.caption}
                onChange={(e) =>
                  setImageDialog((prev) =>
                    prev ? { ...prev, caption: e.target.value } : prev,
                  )
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Có thể bỏ trống. Khi có nội dung sẽ hiển thị bên dưới ảnh ở
                trang công khai.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nguồn ảnh / credit
              </label>
              <input
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                placeholder="VD: Thera Derma hoặc Getty Images"
                value={imageDialog.credit}
                onChange={(e) =>
                  setImageDialog((prev) =>
                    prev ? { ...prev, credit: e.target.value } : prev,
                  )
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Tuỳ chọn — hiển thị nhỏ phía dưới caption dạng "Ảnh: ...".
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ảnh
              </label>
              {imageDialog.file ? (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs flex items-center justify-between gap-3">
                  <span className="truncate">{imageDialog.file.name}</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setImageDialog((prev) =>
                        prev ? { ...prev, file: null } : prev,
                      )
                    }
                  >
                    Bỏ chọn
                  </button>
                </div>
              ) : imageDialog.url ? (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs flex items-center justify-between gap-3">
                  <span className="truncate">{imageDialog.url}</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setImageDialog((prev) =>
                        prev ? { ...prev, url: "" } : prev,
                      )
                    }
                  >
                    Xoá
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="url"
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Dán URL ảnh (https://... hoặc /uploads/...)"
                    value={imageDialog.url}
                    onChange={(e) =>
                      setImageDialog((prev) =>
                        prev ? { ...prev, url: e.target.value } : prev,
                      )
                    }
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>hoặc</span>
                    <input
                      ref={dialogFileInputRef}
                      type="file"
                      accept={BLOG_IMAGE_ACCEPT}
                      className="hidden"
                      onChange={(e) =>
                        handleDialogFilePicked(e.target.files?.[0])
                      }
                    />
                    <button
                      type="button"
                      className="h-8 px-3 inline-flex items-center rounded-md border border-border text-xs bg-background hover:bg-muted/40"
                      onClick={() => dialogFileInputRef.current?.click()}
                    >
                      Upload từ máy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {imageDialog.error ? (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {imageDialog.error}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                className="h-9 px-3 inline-flex items-center rounded-md border border-border text-sm hover:bg-muted/40"
                onClick={closeImageDialog}
                disabled={imageDialog.uploading}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="h-9 px-4 inline-flex items-center rounded-md bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 disabled:opacity-60"
                onClick={submitImageDialog}
                disabled={imageDialog.uploading}
              >
                {imageDialog.uploading ? "Đang chèn…" : "Chèn ảnh"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToolbarBtn({
  label,
  onClick,
  bold = false,
  italic = false,
  tone = "default",
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent/15 text-accent border-accent/30"
      : tone === "success"
        ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
        : "border-border text-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-2.5 inline-flex items-center rounded-md border text-xs hover:bg-muted/40 ${toneClass} ${bold ? "font-bold" : ""} ${italic ? "italic" : ""}`}
    >
      {label}
    </button>
  );
}

function AiSeoPanel({
  title,
  excerpt,
  content,
  seoTitle,
  seoDescription,
  hasEnglish,
  hasFeatured,
}) {
  const wordCount = (content || "").trim().split(/\s+/).filter(Boolean).length;
  const titleScore =
    title?.length >= 35 && title?.length <= 70
      ? 95
      : title?.length > 0
        ? 60
        : 0;
  const excerptScore =
    (excerpt || "").length >= 80 && (excerpt || "").length <= 200
      ? 90
      : (excerpt || "").length > 0
        ? 50
        : 10;
  const seoScore =
    (seoTitle || "").length > 10 && (seoDescription || "").length > 50
      ? 88
      : 35;
  const lengthScore = Math.min(100, Math.round((wordCount / 600) * 100));
  const translationScore = hasEnglish ? 90 : 30;
  const featuredScore = hasFeatured ? 85 : 60;

  const overall = Math.round(
    (titleScore + excerptScore + seoScore + lengthScore + translationScore) / 5,
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">AI quality & SEO</h2>
          <p className="text-xs text-muted-foreground">
            Heuristics until backend AI scoring is wired
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Overall
          </div>
          <div
            className={`h-9 w-12 rounded-md flex items-center justify-center text-sm font-bold ${
              overall >= 75
                ? "bg-emerald-500/15 text-emerald-700"
                : overall >= 50
                  ? "bg-amber-500/15 text-amber-700"
                  : "bg-red-500/15 text-red-700"
            }`}
          >
            {overall}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SignalBar
          label="Title"
          score={titleScore}
          hint={`${title?.length || 0} chars (35-70 ideal)`}
        />
        <SignalBar
          label="Excerpt"
          score={excerptScore}
          hint={`${(excerpt || "").length} chars (80-200 ideal)`}
        />
        <SignalBar
          label="Length"
          score={lengthScore}
          hint={`${wordCount} words`}
        />
        <SignalBar
          label="SEO"
          score={seoScore}
          hint="Both SEO title + desc filled"
        />
        <SignalBar
          label="Translation"
          score={translationScore}
          hint={hasEnglish ? "EN version present" : "Only VI"}
        />
        <SignalBar
          label="Featured"
          score={featuredScore}
          hint={hasFeatured ? "On homepage" : "Standard"}
        />
      </div>
    </div>
  );
}

function SignalBar({ label, score, hint }) {
  const tone =
    score >= 75
      ? "bg-emerald-500"
      : score >= 50
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{score}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {hint ? (
        <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
