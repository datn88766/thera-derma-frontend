import { apiRequest } from '@/api/client';

export const EMAIL_TEMPLATE_LABELS = {
  welcome: 'Chào mừng khách hàng mới',
  booking_confirm: 'Xác nhận đặt lịch',
  booking_cancel: 'Hủy lịch hẹn',
  booking_reminder: 'Nhắc lịch hẹn',
  treatment_notify: 'Thông báo liệu trình',
};

export const EMAIL_TEMPLATE_VARS = {
  welcome: ['{{name}}'],
  booking_confirm: ['{{name}}', '{{date}}', '{{time}}', '{{services}}'],
  booking_cancel: ['{{name}}'],
  booking_reminder: ['{{name}}', '{{date}}', '{{time}}'],
  treatment_notify: ['{{name}}', '{{services}}', '{{date}}', '{{time}}', '{{note}}'],
};

export const emailApi = {
  async getSettings() {
    return apiRequest('/email/settings');
  },
  async verifyConnection() {
    return apiRequest('/email/verify', { method: 'POST' });
  },
  async listTemplates() {
    return apiRequest('/email/templates');
  },
  async updateTemplate(type, data) {
    return apiRequest(`/email/templates/${type}`, { method: 'PATCH', body: data });
  },
  async previewTemplate(type) {
    return apiRequest(`/email/templates/${type}/preview`);
  },
  async sendTest(data) {
    return apiRequest('/email/test', { method: 'POST', body: data });
  },
};
