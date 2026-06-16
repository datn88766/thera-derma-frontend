import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, CalendarDays, Package, Settings, Newspaper,
  MessageSquare, LogOut, Menu, X, ChevronRight, Sparkles, ClipboardCheck, Umbrella, Bell
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/shared/stores/notificationStore';

const BLOG_ADMIN_URL = import.meta.env.VITE_BLOG_URL
  ? `${import.meta.env.VITE_BLOG_URL}/admin/newsroom`
  : 'http://blog.localhost:5174/admin/newsroom';

const adminMenu = [
  { label: 'Tổng quan', icon: LayoutDashboard, path: '/admin' },
  { label: 'Người dùng', icon: Users, path: '/admin/users' },
  { label: 'Dịch vụ & Sản phẩm', icon: Package, path: '/admin/services' },
  { label: 'Lịch hẹn', icon: CalendarDays, path: '/admin/appointments' },
  { label: 'Liệu trình', icon: Sparkles, path: '/admin/treatments' },
  { label: 'Blog', icon: Newspaper, path: BLOG_ADMIN_URL, external: true },
  { label: 'Tin nhắn tự động', icon: MessageSquare, path: '/admin/messages' },
  { label: 'Chấm công NV', icon: ClipboardCheck, path: '/admin/attendance' },
  { label: 'Nghỉ phép', icon: Umbrella, path: '/admin/leave' },
  { label: 'Cài đặt Footer', icon: Settings, path: '/admin/settings' },
];

const staffMenu = [
  { label: 'Tổng quan', icon: LayoutDashboard, path: '/staff' },
  { label: 'Chấm công', icon: ClipboardCheck, path: '/staff/attendance' },
  { label: 'Nghỉ phép', icon: Umbrella, path: '/staff/leave' },
  { label: 'Dịch vụ & Sản phẩm', icon: Package, path: '/staff/services' },
  { label: 'Lịch hẹn', icon: CalendarDays, path: '/staff/appointments' },
  { label: 'Liệu trình KH', icon: Sparkles, path: '/staff/treatments' },
];

export default function DashboardLayout({ children, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const items = useNotificationStore((s) => s.items);
  const markRead = useNotificationStore((s) => s.markRead);
  const menu = role === 'admin' ? adminMenu : staffMenu;
  const panelLabel = role === 'admin' ? 'Admin Panel' : 'Staff Panel';
  const unread = items.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logout('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-foreground text-background z-40 flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-background/10">
          <Link to="/">
            <h1 className="font-heading italic font-light text-2xl text-background">Thera Derma</h1>
          </Link>
          <p className="text-xs text-background/40 mt-1 tracking-widest uppercase">{panelLabel}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const active = !item.external && location.pathname === item.path;
            const className = cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
              active
                ? "bg-primary text-primary-foreground"
                : "text-background/60 hover:text-background hover:bg-background/10"
            );
            if (item.external) {
              return (
                <a key={item.path} href={item.path} target="_blank" rel="noreferrer" className={className}>
                  <item.icon size={18} />
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={className}
              >
                <item.icon size={18} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-background/10">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-background/60 hover:text-background hover:bg-background/10"
          >
            <LogOut size={18} />
            Đăng xuất
          </Button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="relative group">
            <button className="relative p-2 rounded-lg hover:bg-muted" type="button">
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Không có thông báo</p>
              ) : (
                items.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'w-full text-left p-3 border-b border-border last:border-0 hover:bg-muted/50',
                      !n.isRead && 'bg-primary/5',
                    )}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
