import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, CalendarDays, Sparkles, Package, Save, Camera } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function Account() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      setForm({
        phoneNumber: u.phoneNumber || '',
        address: u.address || '',
        dateOfBirth: u.dateOfBirth || '',
        avatarUrl: u.avatarUrl || '',
      });
      if (u?.id) {
        const [appts, plans] = await Promise.all([
          base44.entities.Appointment.filter({ userId: u.id }, '-date', 20),
          base44.entities.TreatmentPlan.filter({ userId: u.id }),
        ]);
        setAppointments(appts);
        setTreatments(plans);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  const tabs = [
    { id: 'profile', label: 'Hồ sơ', icon: User },
    { id: 'appointments', label: 'Lịch hẹn', icon: CalendarDays },
    { id: 'treatments', label: 'Liệu trình', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-heading italic text-2xl">Tài khoản của tôi</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User summary */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} className="w-20 h-20 rounded-full object-cover border-2 border-border" alt="" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-medium">
                {(user?.full_name || 'U')[0]}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.full_name}</h2>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <div className="mt-1"><StatusBadge status={user?.role || 'user'} /></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="max-w-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Họ tên đầy đủ</label>
                <Input value={user?.full_name || ''} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground mt-1">Thay đổi tên trong cài đặt tài khoản hệ thống</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Email</label>
                <Input value={user?.email || ''} disabled className="opacity-60" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Số điện thoại</label>
                <Input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} placeholder="0xxx xxx xxx" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Địa chỉ</label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Địa chỉ của bạn..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Ngày sinh</label>
                <Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">URL ảnh đại diện</label>
                <Input value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground">
              <Save size={16} className="mr-2" />
              {saving ? 'Đang lưu...' : saved ? 'Đã lưu ✓' : 'Lưu thông tin'}
            </Button>
          </div>
        )}

        {/* Appointments tab */}
        {activeTab === 'appointments' && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">{appointments.length} lịch hẹn</p>
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
                <p>Bạn chưa có lịch hẹn nào</p>
                <Link to="/#booking" className="mt-3 inline-block text-primary text-sm underline">Đặt lịch ngay</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(a => (
                  <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{a.serviceNames?.join(', ') || 'Dịch vụ'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.date} lúc {a.time}</p>
                      {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Treatments tab */}
        {activeTab === 'treatments' && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">{treatments.length} liệu trình</p>
            {treatments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
                <p>Bạn chưa có liệu trình nào đang thực hiện</p>
              </div>
            ) : (
              <div className="space-y-4">
                {treatments.map(t => {
                  const progress = t.totalSessions ? Math.min(100, ((t.completedSessions || 0) / t.totalSessions) * 100) : 0;
                  const daysUntil = t.nextSessionDate ? differenceInDays(parseISO(t.nextSessionDate), new Date()) : null;
                  return (
                    <div key={t.id} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-heading italic text-lg">{t.name}</h3>
                          {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                        </div>
                        <StatusBadge status={t.status} />
                      </div>

                      {t.totalSessions > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                            <span>Tiến độ liệu trình</span>
                            <span>{t.completedSessions || 0} / {t.totalSessions} buổi</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mb-3">
                        {t.startDate && <div><span className="font-medium text-foreground">Bắt đầu:</span> {t.startDate}</div>}
                        {t.endDate && <div><span className="font-medium text-foreground">Dự kiến xong:</span> {t.endDate}</div>}
                      </div>

                      {t.nextSessionDate && (
                        <div className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                          daysUntil !== null && daysUntil <= 3
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-primary/5 text-primary border border-primary/20'
                        }`}>
                          <Sparkles size={12} />
                          <span>
                            Buổi tiếp theo: <strong>{t.nextSessionDate}</strong>
                            {daysUntil !== null && (
                              <span className="ml-1">
                                ({daysUntil === 0 ? '— Hôm nay!' : daysUntil < 0 ? `Đã qua ${Math.abs(daysUntil)} ngày` : `còn ${daysUntil} ngày`})
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {t.notes && <p className="mt-3 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">{t.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}