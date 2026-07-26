import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import AppointmentCalendar from '@/components/dashboard/AppointmentCalendar';
import { base44 } from '@/api/entities';
import { useAdminDashboardStats } from '@/shared/hooks/useServices';
import { useQuery } from '@tanstack/react-query';
import { Users, Package, CalendarDays, Sparkles } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: appointments = [], isLoading: apptLoading } = useQuery({
    queryKey: ['recent-appointments'],
    queryFn: () => base44.entities.Appointment.list('-created_date', 8),
  });

  const loading = statsLoading || apptLoading;

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <PageHeader title="Tổng quan" subtitle="Chào mừng trở lại, Admin!" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Khách hàng" value={stats?.totalCustomers ?? 0} icon={Users} color="primary" subtitle="Tổng khách hàng" />
        <StatCard title="Tồn kho thấp" value={stats?.lowStockProducts ?? 0} icon={Package} color="secondary" subtitle="Sản phẩm cần nhập" />
        <StatCard title="Lịch hôm nay" value={stats?.todayAppointments ?? 0} icon={CalendarDays} color="green" subtitle="Lịch hẹn hôm nay" />
        <StatCard title="Liệu trình đang chạy" value={stats?.activeTreatments ?? 0} icon={Sparkles} color="orange" subtitle="Đang thực hiện" />
      </div>

      {stats?.monthRevenue != null && (
        <div className="mb-8 p-4 bg-card border border-border rounded-xl">
          <p className="text-sm text-muted-foreground">Doanh thu ước tính tháng này</p>
          <p className="text-2xl font-semibold mt-1">
            {new Intl.NumberFormat('vi-VN').format(stats.monthRevenue)} ₫
          </p>
        </div>
      )}

      <div className="mb-8">
        <AppointmentCalendar />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-heading italic text-xl">Lịch hẹn gần đây</h2>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[28%]">Khách hàng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[32%]">Dịch vụ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[22%]">Ngày & Giờ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[18%]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{appt.customerName}</p>
                    <p className="text-xs text-muted-foreground">{appt.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {appt.serviceNames?.join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {appt.date} <span className="text-muted-foreground">{appt.time}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={appt.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
