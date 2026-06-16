import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Pencil, Trash2, Sparkles, CalendarDays, Pill, Banknote } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

const formatVND = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const emptyForm = {
  customerId: '',
  userId: '',
  customerName: '',
  catalogTreatmentId: '',
  treatmentId: '',
  name: '',
  description: '',
  status: 'active',
  startDate: '',
  endDate: '',
  nextSessionDate: '',
  totalSessions: '',
  completedSessions: '0',
  treatmentPrice: '',
  medications: [],
  totalPrice: 0,
  notes: '',
};

function calcTotal(treatmentPrice, medications) {
  const base = Number(treatmentPrice) || 0;
  const meds = (medications || []).reduce((sum, m) => sum + (Number(m.subtotal) || 0), 0);
  return base + meds;
}

function medSubtotal(qty, unitPrice) {
  return Math.round((Number(qty) || 0) * (Number(unitPrice) || 0));
}

export default function AdminTreatments({ role = 'admin' }) {
  const [plans, setPlans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalogTreatments, setCatalogTreatments] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [productPickId, setProductPickId] = useState('');

  const load = async () => {
    const [p, c, treatments, prods] = await Promise.all([
      base44.entities.TreatmentPlan.list('-created_date'),
      base44.entities.Customer.filter({ limit: 200 }),
      base44.entities.Treatment.list('-created_date', 200),
      base44.entities.Product.filter({ limit: 200 }),
    ]);
    setPlans(Array.isArray(p) ? p : []);
    const list = Array.isArray(c) ? c : c?.items ?? [];
    setCustomers(list);
    setCatalogTreatments(Array.isArray(treatments) ? treatments : []);
    setProducts(Array.isArray(prods) ? prods : prods?.items ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const computedTotal = useMemo(
    () => calcTotal(form.treatmentPrice, form.medications),
    [form.treatmentPrice, form.medications],
  );

  const filtered = plans.filter(p => {
    const matchSearch = (p.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getDaysUntilNext = (dateStr) => {
    if (!dateStr) return null;
    return differenceInDays(parseISO(dateStr), new Date());
  };

  const openCreate = () => { setForm(emptyForm); setEditId(null); setProductPickId(''); setDialogOpen(true); };
  const openEdit = (p) => {
    setForm({
      ...emptyForm,
      ...p,
      catalogTreatmentId: p.treatmentId || '',
      treatmentId: p.treatmentId || '',
      totalSessions: String(p.totalSessions || ''),
      completedSessions: String(p.completedSessions || 0),
      treatmentPrice: String(p.treatmentPrice ?? 0),
      medications: Array.isArray(p.medications) ? p.medications : [],
      totalPrice: p.totalPrice ?? calcTotal(p.treatmentPrice, p.medications),
    });
    setEditId(p.id);
    setProductPickId('');
    setDialogOpen(true);
  };

  const applyCatalogTreatment = (id) => {
    if (!id || id === '_custom') {
      setForm((f) => ({ ...f, catalogTreatmentId: '', treatmentId: '' }));
      return;
    }
    const t = catalogTreatments.find((x) => x.id === id);
    if (!t) return;
    const sessionsMatch = (t.name || '').match(/(\d+)\s*buổi/i);
    setForm((f) => ({
      ...f,
      catalogTreatmentId: id,
      treatmentId: id,
      name: t.name,
      description: t.description || '',
      treatmentPrice: String(t.price || 0),
      totalSessions: sessionsMatch ? sessionsMatch[1] : f.totalSessions,
    }));
  };

  const addProductLine = () => {
    if (!productPickId) return;
    const prod = products.find((x) => x.id === productPickId);
    if (!prod) return;
    const qty = 1;
    const unitPrice = prod.price || 0;
    const line = {
      productId: prod.id,
      name: prod.name,
      qty,
      unitPrice,
      subtotal: medSubtotal(qty, unitPrice),
    };
    setForm((f) => ({
      ...f,
      medications: [...(f.medications || []), line],
    }));
    setProductPickId('');
  };

  const updateMedLine = (index, field, value) => {
    setForm((f) => {
      const meds = [...(f.medications || [])];
      const row = { ...meds[index], [field]: value };
      if (field === 'qty' || field === 'unitPrice') {
        row.subtotal = medSubtotal(row.qty, row.unitPrice);
      }
      meds[index] = row;
      return { ...f, medications: meds };
    });
  };

  const removeMedLine = (index) => {
    setForm((f) => ({
      ...f,
      medications: (f.medications || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const totalPrice = computedTotal;
    const data = {
      customerId: form.customerId || undefined,
      userId: form.userId || undefined,
      treatmentId: form.treatmentId || form.catalogTreatmentId || undefined,
      name: form.name,
      description: form.description || '',
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate || '',
      nextSessionDate: form.nextSessionDate || '',
      totalSessions: Number(form.totalSessions) || 0,
      completedSessions: Number(form.completedSessions) || 0,
      treatmentPrice: Number(form.treatmentPrice) || 0,
      medications: form.medications || [],
      totalPrice,
      notes: form.notes || '',
    };
    if (!form.customerId && !form.userId) {
      alert('Vui lòng chọn khách hàng');
      setSaving(false);
      return;
    }
    if (!form.name?.trim()) {
      alert('Vui lòng nhập tên liệu trình');
      setSaving(false);
      return;
    }
    if (editId) await base44.entities.TreatmentPlan.update(editId, data);
    else await base44.entities.TreatmentPlan.create(data);
    await load();
    setDialogOpen(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa?')) return;
    await base44.entities.TreatmentPlan.delete(id);
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  return (
    <DashboardLayout role={role}>
      <PageHeader
        title="Liệu trình khách hàng"
        subtitle={`${plans.filter(p => p.status === 'active').length} liệu trình đang hoạt động`}
        action={role === 'admin' ? <Button onClick={openCreate} className="bg-primary text-primary-foreground"><Plus size={16} className="mr-1" /> Tạo liệu trình</Button> : null}
      />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm tên khách, liệu trình..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Đang thực hiện</SelectItem>
            <SelectItem value="paused">Tạm dừng</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">Chưa có liệu trình nào</div>
        ) : filtered.map(plan => {
          const daysUntil = getDaysUntilNext(plan.nextSessionDate);
          const progress = plan.totalSessions ? Math.min(100, ((plan.completedSessions || 0) / plan.totalSessions) * 100) : 0;
          return (
            <div key={plan.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">{plan.customerName || 'Khách hàng'}</p>
                  <h3 className="font-heading italic text-lg text-foreground leading-tight truncate">{plan.name}</h3>
                </div>
                {role === 'admin' && (
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)}><Pencil size={13} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(plan.id)}><Trash2 size={13} /></Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={plan.status} />
                {(plan.totalPrice > 0 || plan.treatmentPrice > 0) && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Banknote size={11} />
                    {formatVND(plan.totalPrice || plan.treatmentPrice)}
                  </span>
                )}
              </div>

              {plan.totalSessions > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Tiến độ</span>
                    <span>{plan.completedSessions || 0}/{plan.totalSessions} buổi</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays size={12} />
                  <span>Bắt đầu: {plan.startDate || '—'}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays size={12} />
                  <span>Kết thúc: {plan.endDate || '—'}</span>
                </div>
              </div>

              {Array.isArray(plan.medications) && plan.medications.length > 0 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Pill size={11} /> Thuốc / sản phẩm:
                  </span>
                  <ul className="mt-1 space-y-0.5 pl-4 list-disc">
                    {plan.medications.slice(0, 3).map((m, i) => (
                      <li key={i}>{m.name} ×{m.qty} — {formatVND(m.subtotal)}</li>
                    ))}
                    {plan.medications.length > 3 && (
                      <li className="list-none -ml-4 text-muted-foreground">+{plan.medications.length - 3} mục khác</li>
                    )}
                  </ul>
                </div>
              )}

              {plan.nextSessionDate && (
                <div className={`mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                  daysUntil !== null && daysUntil <= 3
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : 'bg-primary/5 text-primary border border-primary/20'
                }`}>
                  <Sparkles size={12} />
                  <span>
                    Buổi tiếp theo: {plan.nextSessionDate}
                    {daysUntil !== null && (
                      <span className="ml-1 font-semibold">
                        ({daysUntil === 0 ? 'Hôm nay!' : daysUntil < 0 ? `Đã qua ${Math.abs(daysUntil)} ngày` : `còn ${daysUntil} ngày`})
                      </span>
                    )}
                  </span>
                </div>
              )}

              {plan.notes && <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{plan.notes}</p>}
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading italic text-2xl">{editId ? 'Chỉnh sửa' : 'Tạo liệu trình'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Khách hàng</label>
              <Select
                value={form.customerId || form.userId}
                onValueChange={(v) => {
                  const c = customers.find((x) => x.id === v);
                  setForm({
                    ...form,
                    customerId: c?.id || v,
                    userId: c?.userId || '',
                    customerName: c?.full_name || c?.fullName || '',
                  });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      Chưa có khách hàng — thêm tại Quản lý người dùng
                    </SelectItem>
                  ) : (
                    customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name || c.fullName} — {c.email || c.phone || 'Không email'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
              <p className="text-sm font-medium text-foreground">Giá & liệu trình có sẵn</p>
              <div>
                <label className="text-xs text-muted-foreground">Chọn liệu trình có sẵn (tùy chọn)</label>
                <Select
                  value={form.catalogTreatmentId || '_custom'}
                  onValueChange={applyCatalogTreatment}
                >
                  <SelectTrigger><SelectValue placeholder="Nhập tay hoặc chọn từ danh mục" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_custom">— Nhập tay —</SelectItem>
                    {catalogTreatments.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — {formatVND(t.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tên liệu trình *</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Giá liệu trình (VNĐ)</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.treatmentPrice}
                    onChange={e => setForm({ ...form, treatmentPrice: e.target.value })}
                  />
                </div>
              </div>
              <div><label className="text-xs text-muted-foreground">Mô tả</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Pill size={15} /> Thuốc / sản phẩm
              </p>
              <div className="flex gap-2">
                <Select value={productPickId} onValueChange={setProductPickId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Chọn sản phẩm có sẵn" /></SelectTrigger>
                  <SelectContent>
                    {products.length === 0 ? (
                      <SelectItem value="_none" disabled>Chưa có sản phẩm — thêm tại Dịch vụ & Sản phẩm</SelectItem>
                    ) : (
                      products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {formatVND(p.price)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={addProductLine} disabled={!productPickId}>
                  <Plus size={14} className="mr-1" /> Thêm
                </Button>
              </div>

              {(form.medications || []).length > 0 && (
                <div className="space-y-2">
                  {(form.medications || []).map((m, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end bg-muted/40 rounded-lg p-2">
                      <div className="col-span-5">
                        <label className="text-[10px] text-muted-foreground">Tên</label>
                        <Input
                          value={m.name}
                          onChange={e => updateMedLine(i, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-muted-foreground">SL</label>
                        <Input
                          type="number"
                          min={1}
                          value={m.qty}
                          onChange={e => updateMedLine(i, 'qty', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] text-muted-foreground">Đơn giá</label>
                        <Input
                          type="number"
                          min={0}
                          value={m.unitPrice}
                          onChange={e => updateMedLine(i, 'unitPrice', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-1 text-xs font-medium text-right pb-2">
                        {formatVND(m.subtotal)}
                      </div>
                      <div className="col-span-1 flex justify-end pb-1">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMedLine(i)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-4 py-3">
              <span className="text-sm font-medium">Tổng thanh toán</span>
              <span className="text-lg font-semibold text-primary">{formatVND(computedTotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Tổng số buổi</label><Input type="number" value={form.totalSessions} onChange={e => setForm({ ...form, totalSessions: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Buổi đã hoàn thành</label><Input type="number" value={form.completedSessions} onChange={e => setForm({ ...form, completedSessions: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Ngày bắt đầu</label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Ngày kết thúc DK</label><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-xs text-muted-foreground">Buổi tiếp theo (ngày)</label><Input type="date" value={form.nextSessionDate} onChange={e => setForm({ ...form, nextSessionDate: e.target.value })} /></div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Trạng thái</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang thực hiện</SelectItem>
                  <SelectItem value="paused">Tạm dừng</SelectItem>
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
