import { apiRequest } from './client';

function wrap(data) {
  return { ok: true, data };
}

export const blogNewsroomService = {
  async getStats({ rangeDays = 7 } = {}) {
    const params = new URLSearchParams({ rangeDays: String(rangeDays) });
    return wrap(await apiRequest(`/blog-newsroom/stats?${params}`));
  },

  async getEvents({ limit = 30 } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });
    return wrap(await apiRequest(`/blog-newsroom/events?${params}`));
  },

  async listSources() {
    return wrap(await apiRequest('/blog-newsroom/sources'));
  },

  async createSource(payload) {
    return wrap(await apiRequest('/blog-newsroom/sources', { method: 'POST', body: payload }));
  },

  async updateSource(id, payload) {
    return wrap(await apiRequest(`/blog-newsroom/sources/${id}`, { method: 'PATCH', body: payload }));
  },

  async deleteSource(id) {
    return wrap(await apiRequest(`/blog-newsroom/sources/${id}`, { method: 'DELETE' }));
  },

  async seedDefaultSources() {
    return wrap(await apiRequest('/blog-newsroom/sources/seed-defaults', { method: 'POST' }));
  },

  async testSource(id) {
    return wrap(await apiRequest(`/blog-newsroom/sources/${id}/test`, { method: 'POST' }));
  },

  async runSource(id) {
    return wrap(await apiRequest(`/blog-newsroom/sources/${id}/run`, { method: 'POST' }));
  },

  async crawlTranslate() {
    return wrap(await apiRequest('/blog-newsroom/import/crawl-translate', { method: 'POST' }));
  },

  /** @deprecated use crawlTranslate */
  async crawlTranslateAll() {
    return this.crawlTranslate();
  },

  async listImports({ status } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const qs = params.toString();
    return wrap(await apiRequest(`/blog-newsroom/imports${qs ? `?${qs}` : ''}`));
  },

  async listImportLogs() {
    return wrap(await apiRequest('/blog-newsroom/import/logs'));
  },

  async getPending() {
    return wrap(await apiRequest('/blog-newsroom/pending'));
  },

  async getAnalytics({ rangeDays = 30 } = {}) {
    const params = new URLSearchParams({ rangeDays: String(rangeDays) });
    return wrap(await apiRequest(`/blog-newsroom/analytics?${params}`));
  },

  async getLogs({ limit = 50 } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });
    return wrap(await apiRequest(`/blog-newsroom/logs?${params}`));
  },
};

export const newsroomService = blogNewsroomService;
