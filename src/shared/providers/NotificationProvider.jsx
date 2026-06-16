import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNotificationStore } from '@/shared/stores/notificationStore';

export default function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const connect = useNotificationStore((s) => s.connect);
  const disconnect = useNotificationStore((s) => s.disconnect);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect(user.id);
      return () => disconnect();
    }
    disconnect();
  }, [isAuthenticated, user?.id, connect, disconnect]);

  return children;
}
