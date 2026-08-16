import { apiRequest } from './client';

function wrap(data) {
  return { ok: true, data };
}

export const blogService = {
  async listNews({ lang = 'vi', page = 1, limit = 10, status, search, sort, category, auth = false } = {}) {
    const params = new URLSearchParams({ lang, page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (category && category !== 'all') params.set('category', category);
    const result = await apiRequest(`/blog-posts?${params}`);
    const items = Array.isArray(result) ? result : result?.items ?? [];
    const total = result?.total ?? items.length;
    return { ok: true, data: items, total, page: result?.page ?? page, limit: result?.limit ?? limit };
  },

  async getNewsBySlug(slug, { lang = 'vi' } = {}) {
    const params = new URLSearchParams({ lang });
    const data = await apiRequest(`/blog-posts/slug/${encodeURIComponent(slug)}?${params}`);
    return wrap(data);
  },

  async getNewsById(id, { lang = 'vi' } = {}) {
    const params = new URLSearchParams({ lang });
    const data = await apiRequest(`/blog-posts/${id}?${params}`);
    return wrap(data);
  },

  async getEnglishByVietnameseId(newsViId) {
    const data = await apiRequest(`/blog-posts/en/vi/${newsViId}`);
    return wrap(data);
  },

  async createNews(data) {
    const result = await apiRequest('/blog-posts', { method: 'POST', body: data });
    return wrap(result);
  },

  async createEnglishNews(data) {
    const result = await apiRequest('/blog-posts/en', { method: 'POST', body: data });
    return wrap(result);
  },

  async createBilingualNews(payload) {
    const result = await apiRequest('/blog-posts/bilingual', { method: 'POST', body: payload });
    return wrap(result);
  },

  async updateNews(id, data) {
    const result = await apiRequest(`/blog-posts/${id}`, { method: 'PATCH', body: data });
    return wrap(result);
  },

  async updateEnglishNews(id, data) {
    const result = await apiRequest(`/blog-posts/en/${id}`, { method: 'PUT', body: data });
    return wrap(result);
  },

  async submitNews(id) {
    return wrap(await apiRequest(`/blog-posts/${id}/submit`, { method: 'POST' }));
  },

  async approveNews(id) {
    return wrap(await apiRequest(`/blog-posts/${id}/approve`, { method: 'POST' }));
  },

  async publishNews(id) {
    return wrap(await apiRequest(`/blog-posts/${id}/publish`, { method: 'POST' }));
  },

  async rejectNews(id, reason) {
    return wrap(await apiRequest(`/blog-posts/${id}/reject`, { method: 'POST', body: { reason } }));
  },

  async deleteNews(id) {
    return wrap(await apiRequest(`/blog-posts/${id}`, { method: 'DELETE' }));
  },

  async translateNews(payload) {
    return wrap(await apiRequest('/blog-posts/translate', { method: 'POST', body: payload }));
  },

  async translateToEn(payload) {
    return wrap(await apiRequest('/blog-posts/translate-to-en', { method: 'POST', body: payload }));
  },
};

// ICSTest compatibility aliases
export const newsService = blogService;
