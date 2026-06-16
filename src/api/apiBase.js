const DEFAULT_API_BASE = '/api';

/** API root — dev: `/api` (Vite proxy); prod: `https://api.theraderma.vn/api` */
export function getApiBase() {
  const raw = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE).trim();
  return raw.replace(/\/$/, '');
}

/** Join API base with a path that must NOT include the `/api` prefix. */
export function buildApiUrl(path) {
  const base = getApiBase();
  let normalized = path.startsWith('/') ? path : `/${path}`;

  if (/\/api$/i.test(base)) {
    if (normalized.startsWith('/api/')) normalized = normalized.slice(4);
    else if (normalized === '/api') normalized = '';
  }

  if (!normalized) return base;
  return `${base}${normalized}`;
}

/** Origin for uploads / WebSocket (strips trailing `/api` from absolute base). */
export function getApiOrigin() {
  const base = getApiBase();
  if (base.startsWith('http')) {
    return base.replace(/\/api\/?$/i, '') || base;
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function resolveUploadsUrl(url) {
  if (!url) return '';
  const value = String(url).trim();
  if (value.startsWith('http') || value.startsWith('blob:') || value.startsWith('data:')) {
    return value;
  }
  const path = value.startsWith('/') ? value : `/${value}`;
  const origin = getApiOrigin();
  return origin ? `${origin}${path}` : path;
}
