import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

const emptyForm = { customerName: '', customerEmail: '', customerPhoneNumber: '', serviceNames: [], date: '', time: '', status: 'pending', notes: '' };

export default function AdminAppointments({ role = 'admin' }) {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [appts, svcs] = await Promise.all([
      base44.entities.Appointment.list('-date', 100),
      base44.entities.Service.filter({ type: 'service' }),
    ]);
    setAppointments(appts);
    setServices(svcs);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = appointments.filter(a => {
    const matchSearch = (a.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.customerPhoneNumber || '').includes(search);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (a) => { setForm({ ...a, serviceNames: a.serviceNames || [] }); setEditId(a.id); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      customerName: form.customerName,
      customerEmail: form.customerEmail || '',
      customerPhoneNumber: form.customerPhoneNumber,
      serviceNames: form.serviceNames || [],
      date: form.date,
      time: form.time,
      status: form.status,
      notes: form.notes || '',
    };
    if (editId) await base44.entities.Appointment.update(editId, payload);
    else await base44.entities.Appointment.createAdmin(payload);
    await load();
    setDialogOpen(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa?')) return;
    await base44.entities.Appointment.delete(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const updateStatus = async (id, status) => {
    await base44.entities.Appointment.update(id, { status });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  return (
    <DashboardLayout role={role}>
      <PageHeader
        title="Quản lý lịch hẹn"
        subtitle={`${appointments.length} lịch hẹn`}
        action={<Button onClick={openCreate} className="bg-primary text-primary-foreground"><Plus size={16} className="mr-1" /> Thêm lịch</Button>}
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm tên, SĐT..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ xác nhận</SelectItem>
              <SelectItem value="confirmed">Đã xác nhận</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Khách hàng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Dịch vụ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Ngày & Giờ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{a.customerName}</p>
                    <p className="text-xs text-muted-foreground">{a.customerPhoneNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{a.serviceNames?.join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-sm">{a.date} <span className="text-muted-foreground">{a.time}</span></td>
                  <td className="px-4 py-3">
                    <Select value={a.status} onValueChange={v => updateStatus(a.id, v)}>
                      <SelectTrigger className="w-36 h-7 text-xs border-0 p-0 shadow-none">
                        <StatusBadge status={a.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ xác nhận</SelectItem>
                        <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></Button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading italic text-2xl">{editId ? 'Chỉnh sửa' : 'Thêm lịch hẹn'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs text-muted-foreground">Tên khách hàng *</label><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Email</label><Input value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">SĐT</label><Input value={form.customerPhoneNumber} onChange={e => setForm({ ...form, customerPhoneNumber: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Ngày *</label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Giờ *</label><Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Trạng thái</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs text-muted-foreground">Ghi chú</label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}