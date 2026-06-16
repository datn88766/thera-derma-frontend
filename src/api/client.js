const TOKEN_KEY = 'theraderma_access_token';
const REFRESH_KEY = 'theraderma_refresh_token';

const PROTECTED_PREFIXES = ['/admin', '/staff', '/manager', '/customer', '/account'];

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

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function isOnProtectedPage() {
  const path = window.location.pathname;
  return PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(data?.message || 'Refresh failed');
        setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
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
      if (isOnProtectedPage()) {
        const from = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?from=${from}`;
      }
    }
    const message =
      res.status === 403
        ? data?.message || 'Bạn không có quyền thực hiện thao tác này'
        : Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message || res.statusText || 'Yêu cầu thất bại';
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function apiRequest(path, options = {}) {
  const doRequest = async () => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    return fetch(`/api${path}`, {
      ...options,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  const res = await doRequest();
  return parseResponse(res, async () => {
    const retryRes = await doRequest();
    return parseResponse(retryRes);
  });
}
