import React, { useLayoutEffect, useState } from 'react';
import { base44 } from '@/api/entities';
import CoverMediaUpload from '@/components/admin/CoverMediaUpload';
import RichDescriptionEditor from '@/components/admin/RichDescriptionEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const emptyServiceForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  videoUrl: '',
  duration: '',
  type: 'service',
  inStock: true,
};

export function serviceToForm(service) {
  if (!service) return { ...emptyServiceForm };
  return {
    name: service.name ?? '',
    description: service.description ?? '',
    price: String(service.price ?? ''),
    category: service.category ?? '',
    imageUrl: service.imageUrl ?? '',
    videoUrl: service.videoUrl ?? '',
    duration: String(service.duration ?? ''),
    type: service.type ?? 'service',
    inStock: service.inStock !== false,
  };
}

export default function ServiceEditDialog({ open, onOpenChange, service, onSaved }) {
  const [form, setForm] = useState(() => serviceToForm(service));
  const [saving, setSaving] = useState(false);
  const editId = service?.id ?? null;

  useLayoutEffect(() => {
    if (!open) return;
    if (service) setForm(serviceToForm(service));
  }, [open, service?.id, service?.updated_date, service]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên dịch vụ');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: form.name,
        description: form.description || '',
        price: Number(form.price) || 0,
        category: form.category || '',
        imageUrl: form.imageUrl || '',
        videoUrl: form.videoUrl || '',
        duration: Number(form.duration) || 0,
        type: form.type,
        inStock: !!form.inStock,
      };

      if (editId) await base44.entities.Service.update(editId, data);
      else await base44.entities.Service.create(data);

      onOpenChange(false);
      toast.success(editId ? 'Đã cập nhật' : 'Đã thêm mới');
      onSaved?.();
    } catch (error) {
      toast.error(error.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading italic text-2xl">
            {editId ? 'Chỉnh sửa' : 'Thêm mới'}
          </DialogTitle>
        </DialogHeader>

        <div key={editId ?? 'new'} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Tên *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Loại</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Dịch vụ</SelectItem>
                  <SelectItem value="product">Sản phẩm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Danh mục</label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Giá (VNĐ)</label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            {form.type === 'service' && (
              <div>
                <label className="text-xs text-muted-foreground">Thời gian (phút)</label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CoverMediaUpload
              key={`img-${editId}`}
              label="Hình ảnh đại diện"
              value={form.imageUrl}
              onChange={(imageUrl) => setForm({ ...form, imageUrl })}
              mode="image"
            />
            <CoverMediaUpload
              key={`vid-${editId}`}
              label="Video demo"
              value={form.videoUrl}
              onChange={(videoUrl) => setForm({ ...form, videoUrl })}
              mode="video"
            />
          </div>

          <RichDescriptionEditor
            key={`desc-${editId}`}
            value={form.description}
            onChange={(description) => setForm({ ...form, description })}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="service-edit-inStock"
              checked={form.inStock}
              onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
            />
            <label htmlFor="service-edit-inStock" className="text-sm">Đang khả dụng / Còn hàng</label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
