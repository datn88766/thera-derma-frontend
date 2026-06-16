import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { base44 } from '@/api/entities';
import { Package, CalendarDays, Sparkles, Clock } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function ManagerDashboard() {
  const [stats, setStats] = useState({ services: 0, pendingAppts: 0, activePlans: 0, upcomingNext: 0 });
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [urgentTreatments, setUrgentTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [services, appointments, treatments] = await Promise.all([
        base44.entities.Service.list(),
        base44.entities.Appointment.list('-date', 50),
        base44.entities.TreatmentPlan.filter({ status: 'active' }),
      ]);

      const today = new Date();
      const upcoming = appointments.filter(a =>
        (a.status === 'pending' || a.status === 'confirmed') && a.date >= today.toISOString().split('T')[0]
      ).sort((a, b) => a.date.localeCompare(b.date));

      const urgent = treatments.filter(t => {
        if (!t.nextSessionDate) return false;
        const days = differenceInDays(parseISO(t.nextSessionDate), today);
        return days <= 7;
      }).sort((a, b) => a.nextSessionDate.localeCompare(b.nextSessionDate));

      setStats({
        services: services.length,
        pendingAppts: appointments.filter(a => a.status === 'pending').length,
        activePlans: treatments.length,
        upcomingNext: upcoming.length,
      });
      setUpcomingAppts(upcoming.slice(0, 6));
      setUrgentTreatments(urgent.slice(0, 6));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <DashboardLayout role="staff">
      <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="staff">
      <PageHeader title="Tổng quan" subtitle="Quản lý lịch hẹn và liệu trình khách hàng" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Dịch vụ & Sản phẩm" value={stats.services} icon={Package} color="primary" />
        <StatCard title="Chờ xác nhận" value={stats.pendingAppts} icon={Clock} color="orange" subtitle="Cần xử lý" />
        <StatCard title="Liệu trình đang chạy" value={stats.activePlans} icon={Sparkles} color="green" />
        <StatCard title="Lịch hẹn sắp tới" value={stats.upcomingNext} icon={CalendarDays} color="secondary" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-heading italic text-xl">Lịch hẹn sắp tới</h2>
          </div>
          <div className="divide-y divide-border">
            {upcomingAppts.length === 0 ? (
              <p className="px-6 py-8 text-center text-muted-foreground text-sm">Không có lịch hẹn sắp tới</p>
            ) : upcomingAppts.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{a.customerName}</p>
                  <p className="text-xs text-muted-foreground">{a.serviceNames?.join(', ') || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{a.date}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Urgent treatments */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-heading italic text-xl">Liệu trình cần chú ý</h2>
            <p className="text-xs text-muted-foreground">Buổi tiếp theo trong vòng 7 ngày</p>
          </div>
          <div className="divide-y divide-border">
            {urgentTreatments.length === 0 ? (
              <p className="px-6 py-8 text-center text-muted-foreground text-sm">Không có liệu trình nào cần chú ý</p>
            ) : urgentTreatments.map(t => {
              const days = differenceInDays(parseISO(t.nextSessionDate), new Date());
              return (
                <div key={t.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{t.customerName || 'Khách hàng'}</p>
                    <p className="text-xs text-muted-foreground">{t.name}</p>
                  </div>
                  <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    days <= 0 ? 'bg-red-100 text-red-700' :
                    days <= 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {days <= 0 ? 'Hôm nay!' : `${days} ngày nữa`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}