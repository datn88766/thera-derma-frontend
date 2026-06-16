import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import ServiceEditDialog from '@/components/admin/ServiceEditDialog';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { formatServicePriceRange } from '@/shared/utils/servicePrice';
import { resolveMediaUrl } from '@/lib/mediaUpload';

export default function AdminServices({ role = 'admin' }) {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const load = () => base44.entities.Service.list('-created_date').then((d) => {
    setServices(d);
    setLoading(false);
  });

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (loading || !services.length) return;
    const editId = searchParams.get('edit');
    const q = searchParams.get('q');
    let target = null;
    if (editId) target = services.find((s) => s.id === editId);
    else if (q) target = services.find((s) => s.name?.toLowerCase() === q.toLowerCase());
    if (target) {
      setEditingService(target);
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [loading, services, searchParams, setSearchParams]);

  const filtered = services.filter((s) => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || s.type === typeFilter;
    return matchSearch && matchType;
  });

  const openCreate = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditingService(s);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open) => {
    setDialogOpen(open);
    if (!open) setEditingService(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa?')) return;
    await base44.entities.Service.delete(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <DashboardLayout role={role}>
      <PageHeader
        title="Dịch vụ & Sản phẩm"
        subtitle={`${services.length} mục trong danh mục`}
        action={(
          <Button onClick={openCreate} className="bg-primary text-primary-foreground">
            <Plus size={16} className="mr-1" /> Thêm mới
          </Button>
        )}
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm tên..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="service">Dịch vụ</SelectItem>
              <SelectItem value="product">Sản phẩm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Tên</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Loại</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Danh mục</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Giá</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Thời gian</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Tình trạng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.imageUrl && (
                        <img
                          src={resolveMediaUrl(s.imageUrl)}
                          className="w-10 h-10 rounded-lg object-cover"
                          alt=""
                        />
                      )}
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.type} /></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.category || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatServicePriceRange(s.price, s.priceMax) || `${s.price?.toLocaleString('vi-VN')}đ`}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {s.type === 'service' && s.duration ? `${s.duration} phút` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.inStock ? 'Khả dụng' : 'Hết hàng'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></Button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ServiceEditDialog
        key={editingService?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        service={editingService}
        onSaved={load}
      />
    </DashboardLayout>
  );
}
