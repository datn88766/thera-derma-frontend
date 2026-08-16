export { buildApiUrl, resolvePublicUploadsUrl, getToken, getApiOrigin } from './client';

/** Domain shown in Facebook/OG share preview inside the article editor */
export function getBlogShareDomain() {
  if (typeof window === 'undefined') return 'blog.theraderma.vn';
  const host = window.location.hostname.toLowerCase();
  if (host === 'blog.localhost' || host.endsWith('.localhost')) {
    return 'blog.theraderma.vn';
  }
  if (host.includes('theraderma')) return host;
  return host || 'blog.theraderma.vn';
}
