import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const [form, setForm] = useState({ phone: '', email: '', address: '', openingHours: '', facebookUrl: '', instagramUrl: '', tiktokUrl: '', copyrightText: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recordId, setRecordId] = useState(null);

  useEffect(() => {
    base44.entities.FooterSettings.list().then(data => {
      if (data.length > 0) {
        const s = data[0];
        setForm({
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || '',
          openingHours: s.openingHours || '',
          facebookUrl: s.facebookUrl || '',
          instagramUrl: s.instagramUrl || '',
          tiktokUrl: s.tiktokUrl || '',
          copyrightText: s.copyrightText || '',
        });
        setRecordId(s.id);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    if (recordId) await base44.entities.FooterSettings.update(recordId, form);
    else { const r = await base44.entities.FooterSettings.create(form); setRecordId(r.id); }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="admin">
      <PageHeader title="Cài đặt Footer" subtitle="Quản lý thông tin liên hệ và mạng xã hội hiển thị trên trang web" />

      <div className="max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Thông tin liên hệ</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground block mb-1">Số điện thoại</label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+84 xxx xxx xxx" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="hello@theraderma.com" /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Địa chỉ</label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Địa chỉ spa..." /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Giờ mở cửa</label><Input value={form.openingHours} onChange={e => setForm({ ...form, openingHours: e.target.value })} placeholder="Daily 10:00 AM - 8:00 PM" /></div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-semibold mb-4 text-foreground">Mạng xã hội</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground block mb-1">Facebook URL</label><Input value={form.facebookUrl} onChange={e => setForm({ ...form, facebookUrl: e.target.value })} placeholder="https://facebook.com/..." /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Instagram URL</label><Input value={form.instagramUrl} onChange={e => setForm({ ...form, instagramUrl: e.target.value })} placeholder="https://instagram.com/..." /></div>
              <div><label className="text-xs text-muted-foreground block mb-1">TikTok URL</label><Input value={form.tiktokUrl} onChange={e => setForm({ ...form, tiktokUrl: e.target.value })} placeholder="https://tiktok.com/..." /></div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-semibold mb-4 text-foreground">Bản quyền</h3>
            <div><label className="text-xs text-muted-foreground block mb-1">Nội dung bản quyền</label><Input value={form.copyrightText} onChange={e => setForm({ ...form, copyrightText: e.target.value })} placeholder="© 2026 Thera Derma. All rights reserved." /></div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground">
            <Save size={16} className="mr-2" />
            {saving ? 'Đang lưu...' : saved ? 'Đã lưu ✓' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}