import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Pencil, Trash2, Eye, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardMobileList, DashboardMobileCard } from '@/components/dashboard/MobileDataCard';
import { resolveMediaUrl } from '@/lib/mediaUpload';

const emptyForm = {
  customerMode: 'existing',
  customerId: '',
  customerName: '',
  customerEmail: '',
  customerPhoneNumber: '',
  serviceNames: [],
  date: '',
  time: '',
  status: 'pending',
  notes: '',
  activateAccount: false,
  notifyChannel: 'email',
  assignTreatment: true,
  totalSessions: 1,
};

export default function AdminAppointments({ role = 'admin' }) {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const load = async () => {
    const [appts, svcs, trts, custResult] = await Promise.all([
      base44.entities.Appointment.list('-date', 100),
      base44.entities.Service.list('-created_date', 100),
      base44.entities.Treatment.list('-created_date', 200),
      base44.entities.Customer.filter({ limit: 200 }, '-created_date'),
    ]);
    setAppointments(appts);
    setServices(Array.isArray(svcs) ? svcs : []);
    setTreatments(Array.isArray(trts) ? trts : []);
    setCustomers(Array.isArray(custResult) ? custResult : custResult?.items ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const treatmentName = (treatmentId) =>
    treatments.find((tr) => tr.id === treatmentId)?.name || '';

  const filtered = appointments.filter(a => {
    const matchSearch = (a.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.customerPhoneNumber || '').includes(search);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setSaving(false);
    setForm(emptyForm);
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (a) => {
    setSaving(false);
    setForm({
      ...emptyForm,
      ...a,
      customerMode: a.customerId ? 'existing' : 'guest',
      customerId: a.customerId || '',
      serviceNames: Array.isArray(a.serviceNames) ? a.serviceNames : [],
      activateAccount: false,
      notifyChannel: 'none',
      assignTreatment: false,
    });
    setEditId(a.id);
    setDialogOpen(true);
  };

  const handleDialogChange = (open) => {
    setDialogOpen(open);
    if (!open) setSaving(false);
  };

  const pickCustomer = (customerId) => {
    const c = customers.find((x) => x.id === customerId);
    if (!c) return;
    setForm((prev) => ({
      ...prev,
      customerId,
      customerName: c.full_name || c.fullName || '',
      customerEmail: c.email || '',
      customerPhoneNumber: c.phone || c.phoneNumber || '',
    }));
  };

  const handleSave = async () => {
    if (!form.customerName?.trim()) {
      toast.error('Vui lòng nhập tên khách hàng');
      return;
    }
    if (!form.customerPhoneNumber || form.customerPhoneNumber.replace(/\D/g, '').length < 8) {
      toast.error('Số điện thoại phải có ít nhất 8 số');
      return;
    }
    if (!form.serviceNames?.length) {
      toast.error('Vui lòng chọn dịch vụ');
      return;
    }
    if (!form.date || !form.time) {
      toast.error('Vui lòng chọn ngày và giờ');
      return;
    }
    if (!editId && form.customerMode === 'existing' && !form.customerId) {
      toast.error('Vui lòng chọn khách hàng trong hệ thống');
      return;
    }
    if (!editId && form.customerMode === 'guest' && form.activateAccount && !form.customerEmail?.trim()) {
      toast.error('Kích hoạt tài khoản cần email trùng khớp với người dùng đã có');
      return;
    }
    if (!editId && form.customerMode === 'guest' && !form.activateAccount) {
      if (form.notifyChannel === 'email' && !form.customerEmail?.trim()) {
        toast.error('Cần email để gửi thông báo liệu trình');
        return;
      }
      if (form.notifyChannel === 'zalo' && !form.customerPhoneNumber?.trim()) {
        toast.error('Cần SĐT để gửi thông báo Zalo OA');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail || '',
        customerPhoneNumber: form.customerPhoneNumber.trim(),
        serviceNames: form.serviceNames,
        date: form.date,
        time: form.time,
        status: form.status,
        notes: form.notes || '',
      };

      if (editId) {
        await base44.entities.Appointment.update(editId, payload);
      } else {
        await base44.entities.Appointment.createAdmin({
          ...payload,
          customerMode: form.customerMode,
          customerId: form.customerMode === 'existing' ? form.customerId : undefined,
          activateAccount: form.customerMode === 'guest' ? form.activateAccount : false,
          notifyChannel: form.customerMode === 'guest' && !form.activateAccount
            ? form.notifyChannel
            : 'none',
          assignTreatment: form.assignTreatment,
          totalSessions: Number(form.totalSessions) || 1,
        });
      }

      await load();
      setDialogOpen(false);
      toast.success(editId ? 'Đã cập nhật lịch hẹn' : 'Đã thêm lịch hẹn và gán liệu trình');
    } catch (error) {
      toast.error(error.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (serviceName) => {
    setForm((prev) => {
      const selected = prev.serviceNames || [];
      const next = selected.includes(serviceName)
        ? selected.filter((n) => n !== serviceName)
        : [...selected, serviceName];
      return { ...prev, serviceNames: next };
    });
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

  const isGuest = form.customerMode === 'guest';

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
        <DashboardMobileList loading={loading} empty={!loading && filtered.length === 0}>
          {filtered.map((a) => (
            <DashboardMobileCard
              key={a.id}
              title={a.customerName}
              subtitle={a.customerPhoneNumber}
              badges={<StatusBadge status={a.status} />}
              meta={[
                { label: 'Dịch vụ', value: a.serviceNames?.join(', ') || '—', full: true },
                ...(a.treatmentId ? [{ label: 'Liệu trình', value: treatmentName(a.treatmentId) || '—', full: true }] : []),
                { label: 'Ngày', value: a.date },
                { label: 'Giờ', value: a.time },
              ]}
              actions={(
                <>
                  <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
                    <SelectTrigger className="h-8 text-xs w-auto min-w-[8rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Chờ xác nhận</SelectItem>
                      <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => setViewItem(a)}><Eye size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a)}><Pencil size={14} /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive ml-auto" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></Button>
                </>
              )}
            />
          ))}
        </DashboardMobileList>
        <div className="dashboard-table-wrap hidden md:block">
          <table className="dashboard-table">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[24%]">Khách hàng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[28%]">Dịch vụ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[18%]">Ngày & Giờ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[16%]">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[14%]">Thao tác</th>
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
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <p>{a.serviceNames?.join(', ') || '—'}</p>
                    {a.treatmentId && (
                      <p className="text-xs text-primary mt-0.5">{treatmentName(a.treatmentId) || 'Liệu trình'}</p>
                    )}
                    {a.photoUrl && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <ImageIcon size={12} /> Có ảnh
                      </span>
                    )}
                  </td>
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
                    <Button variant="ghost" size="icon" onClick={() => setViewItem(a)}><Eye size={14} /></Button>
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

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-lg max-h-[90vh] !flex !flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="font-heading italic text-2xl">{editId ? 'Chỉnh sửa' : 'Thêm lịch hẹn'}</DialogTitle>
            <DialogDescription className="sr-only">
              Tạo hoặc cập nhật lịch hẹn và gán liệu trình cho khách hàng
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3">
            {!editId && (
              <div>
                <label className="text-xs text-muted-foreground">Loại khách hàng</label>
                <div className="mt-1.5 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={form.customerMode === 'existing' ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, customerMode: 'existing', activateAccount: false })}
                  >
                    Khách có sẵn
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={form.customerMode === 'guest' ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, customerMode: 'guest', customerId: '' })}
                  >
                    Khách ngắn hạn
                  </Button>
                </div>
              </div>
            )}

            {!editId && form.customerMode === 'existing' && (
              <div>
                <label className="text-xs text-muted-foreground">Chọn khách hàng *</label>
                <Select value={form.customerId || ''} onValueChange={pickCustomer}>
                  <SelectTrigger><SelectValue placeholder="Chọn từ hệ thống" /></SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <SelectItem value="_none" disabled>Chưa có khách hàng</SelectItem>
                    ) : (
                      customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name || c.fullName} — {c.email || c.phone || '—'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!editId && isGuest && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activateAccount}
                    onChange={(e) => setForm({
                      ...form,
                      activateAccount: e.target.checked,
                      notifyChannel: e.target.checked ? 'none' : 'email',
                    })}
                  />
                  Kích hoạt / liên kết tài khoản (email phải trùng khớp user đã có)
                </label>

                {!form.activateAccount && (
                  <div>
                    <label className="text-xs text-muted-foreground">Thông báo liệu trình</label>
                    <Select
                      value={form.notifyChannel}
                      onValueChange={(v) => setForm({ ...form, notifyChannel: v })}
                    >
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Gửi qua Email</SelectItem>
                        <SelectItem value="zalo">Gửi qua Zalo OA</SelectItem>
                        <SelectItem value="none">Không gửi</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Khách ngắn hạn không có tài khoản — thông báo qua email hoặc Zalo.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div><label className="text-xs text-muted-foreground">Tên khách hàng *</label><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Email{isGuest && (form.activateAccount || form.notifyChannel === 'email') ? ' *' : ''}</label><Input value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">SĐT *</label><Input value={form.customerPhoneNumber} onChange={e => setForm({ ...form, customerPhoneNumber: e.target.value })} /></div>
              <div>
                <label className="text-xs text-muted-foreground">Ngày *</label>
                <Input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Giờ *</label>
                <Input type="time" required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Dịch vụ *</label>
              <div className="mt-1.5 max-h-36 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {services.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Chưa có dịch vụ</p>
                ) : (
                  services.map((s) => {
                    const checked = (form.serviceNames || []).includes(s.name);
                    return (
                      <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                        <input type="checkbox" checked={checked} onChange={() => toggleService(s.name)} />
                        <span className="flex-1">{s.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {!editId && (
              <div className="grid grid-cols-2 gap-3 items-end">
                <label className="flex items-center gap-2 text-sm col-span-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.assignTreatment}
                    onChange={(e) => setForm({ ...form, assignTreatment: e.target.checked })}
                  />
                  Tự động gán liệu trình cho khách
                </label>
                {form.assignTreatment && (
                  <div>
                    <label className="text-xs text-muted-foreground">Số buổi</label>
                    <Input
                      type="number"
                      min={1}
                      value={form.totalSessions}
                      onChange={(e) => setForm({ ...form, totalSessions: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}

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

          <DialogFooter className="px-6 py-4 border-t border-border bg-background">
            <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>Hủy</Button>
            <Button type="button" onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading italic text-2xl">Chi tiết lịch hẹn</DialogTitle>
            <DialogDescription className="sr-only">Thông tin khách hàng gửi kèm lịch hẹn</DialogDescription>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">{viewItem.customerName}</p>
                <p className="text-xs text-muted-foreground">{viewItem.customerPhoneNumber} {viewItem.customerEmail ? `• ${viewItem.customerEmail}` : ''}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dịch vụ</p>
                <p>{viewItem.serviceNames?.join(', ') || '—'}</p>
              </div>
              {viewItem.treatmentId && (
                <div>
                  <p className="text-xs text-muted-foreground">Liệu trình</p>
                  <p>{treatmentName(viewItem.treatmentId) || '—'}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Ngày & giờ</p>
                <p>{viewItem.date} lúc {viewItem.time}</p>
              </div>
              {viewItem.skinCondition && (
                <div>
                  <p className="text-xs text-muted-foreground">Mô tả tình trạng da</p>
                  <p className="whitespace-pre-wrap">{viewItem.skinCondition}</p>
                </div>
              )}
              {viewItem.photoUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ảnh tình trạng da</p>
                  <img
                    src={resolveMediaUrl(viewItem.photoUrl)}
                    alt=""
                    className="w-full max-h-64 object-contain rounded-md border border-border"
                  />
                </div>
              )}
              {viewItem.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Ghi chú</p>
                  <p className="whitespace-pre-wrap">{viewItem.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewItem(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
