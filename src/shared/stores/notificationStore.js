import { create } from 'zustand';
import { io } from 'socket.io-client';
import { getToken } from '@/api/client';
import { base44 } from '@/api/entities';

export const useNotificationStore = create((set, get) => ({
  items: [],
  socket: null,
  connected: false,

  async load() {
    try {
      const items = await base44.entities.Notification.list();
      set({ items: Array.isArray(items) ? items : [] });
    } catch {
      set({ items: [] });
    }
  },

  connect(userId) {
    if (!userId || get().socket) return;
    const socket = io(`${window.location.origin}/notifications`, {
      path: '/socket.io',
      auth: { token: getToken() },
      transports: ['websocket', 'polling'],
    });
    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));
    socket.on('notification:new', (n) => {
      set({ items: [n, ...get().items] });
    });
    socket.on('booking:created', () => {
      get().load();
    });
    set({ socket });
    get().load();
  },

  disconnect() {
    get().socket?.disconnect();
    set({ socket: null, connected: false, items: [] });
  },

  async markRead(id) {
    await base44.entities.Notification.markRead(id);
    set({
      items: get().items.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    });
  },

  unreadCount() {
    return get().items.filter((n) => !n.isRead).length;
  },
}));
