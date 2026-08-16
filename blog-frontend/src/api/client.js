import {
  buildApiUrl,
  getApiBase,
  getApiOrigin,
  resolveUploadsUrl,
} from '../../../src/api/apiBase.js';
import { getHomeUrl } from '../lib/homeUrl.js';

const TOKEN_KEY = 'theraderma_access_token';
const REFRESH_KEY = 'theraderma_refresh_token';

export { buildApiUrl, getApiBase, getApiOrigin, resolveUploadsUrl };
export { resolveUploadsUrl as resolvePublicUploadsUrl } from '../../../src/api/apiBase.js';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = fetch(buildApiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Refresh failed');
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        return data.accessToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

function isAdminLoginPage() {
  return window.location.pathname === '/admin/login';
}

async function parseResponse(res, retryFn) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 401 && retryFn) {
      const newToken = await refreshAccessToken();
      if (newToken) return retryFn();
    }
    if (res.status === 401) {
      clearToken();
      if (
        window.location.pathname.startsWith('/admin') &&
        !isAdminLoginPage()
      ) {
        const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        const ssoUrl = `${getHomeUrl()}/auth/sso?returnTo=${encodeURIComponent(callbackUrl)}`;
        window.location.href = ssoUrl;
      }
    }
    throw new Error(
      Array.isArray(data?.message) ? data.message.join(', ') : data?.message || res.statusText,
    );
  }
  return data;
}

export async function apiRequest(path, options = {}) {
  const doRequest = async () => {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(buildApiUrl(path), {
      ...options,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };
  const res = await doRequest();
  return parseResponse(res, async () => parseResponse(await doRequest()));
}
