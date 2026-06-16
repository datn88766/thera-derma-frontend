import { apiRequest, setTokens, clearToken } from './client';

function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function createEntityClient(resourcePath, { singleton = false } = {}) {
  return {
    async list(sort, limit) {
      if (singleton) {
        const item = await apiRequest(resourcePath);
        return [item];
      }
      const query = buildQuery({ sort, limit });
      const result = await apiRequest(`${resourcePath}${query}`);
      if (result?.items) return result.items;
      return result?.items ?? result;
    },

    async filter(filters = {}, sort, limit) {
      if (singleton) {
        const item = await apiRequest(resourcePath);
        return [item];
      }
      const query = buildQuery({ ...filters, sort, limit });
      const result = await apiRequest(`${resourcePath}${query}`);
      return result?.items ?? result;
    },

    async get(id) {
      return apiRequest(`${resourcePath}/${id}`);
    },

    async create(data) {
      if (singleton) {
        return apiRequest(resourcePath, { method: 'PUT', body: data });
      }
      return apiRequest(resourcePath, { method: 'POST', body: data });
    },

    async update(id, data) {
      if (singleton) {
        return apiRequest(resourcePath, { method: 'PUT', body: data });
      }
      return apiRequest(`${resourcePath}/${id}`, { method: 'PATCH', body: data });
    },

    async delete(id) {
      return apiRequest(`${resourcePath}/${id}`, { method: 'DELETE' });
    },
  };
}

export const entities = {
  User: {
    ...createEntityClient('/users'),
    async me() {
      return apiRequest('/auth/me');
    },
    async updateMe(data) {
      return apiRequest('/auth/me', { method: 'PATCH', body: data });
    },
  },
  Customer: createEntityClient('/customers'),
  Service: createEntityClient('/services'),
  Product: createEntityClient('/products'),
  Appointment: {
    ...createEntityClient('/appointments'),
    async createAdmin(data) {
      return apiRequest('/appointments/admin', { method: 'POST', body: data });
    },
  },
  Treatment: createEntityClient('/treatments'),
  TreatmentPlan: createEntityClient('/treatment-plans'),
  BlogPost: {
    ...createEntityClient('/blog-posts'),
    async incrementView(id) {
      return apiRequest(`/blog-posts/${id}/view`, { method: 'POST' });
    },
    async getBySlug(slug) {
      return apiRequest(`/blog-posts/slug/${slug}`);
    },
    async categories() {
      return apiRequest('/blog-posts/categories');
    },
    async createComment(postId, data) {
      return apiRequest(`/blog-posts/${postId}/comments`, {
        method: 'POST',
        body: data,
      });
    },
  },
  FooterSettings: createEntityClient('/footer-settings', { singleton: true }),
  AutomatedMessage: createEntityClient('/automated-messages'),
  Attendance: createEntityClient('/attendance'),
  LeaveRequest: {
    ...createEntityClient('/leave-requests'),
    async cancel(id) {
      return apiRequest(`/leave-requests/${id}/cancel`, { method: 'PATCH' });
    },
  },
  Notification: {
    async list() {
      return apiRequest('/notifications');
    },
    async markRead(id) {
      return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    },
  },
  Dashboard: {
    async adminStats() {
      return apiRequest('/dashboard/admin/stats');
    },
  },
};

export const auth = {
  async login(email, password) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return result.user;
  },

  async register(data) {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: data,
    });
    setTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return result.user;
  },

  async me() {
    return apiRequest('/auth/me');
  },

  async updateMe(data) {
    return apiRequest('/auth/me', { method: 'PATCH', body: data });
  },

  async logout(redirectUrl) {
    const refreshToken = localStorage.getItem('theraderma_refresh_token');
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
        });
      }
    } catch {
      // ignore
    }
    clearToken();
    if (redirectUrl) {
      window.location.href = typeof redirectUrl === 'string' ? redirectUrl : '/login';
    }
  },

  redirectToLogin(fromUrl) {
    const target = fromUrl ? `/login?from=${encodeURIComponent(fromUrl)}` : '/login';
    window.location.href = target;
  },
};

export const base44 = { entities, auth };
