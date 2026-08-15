import React, { useLayoutEffect, useState } from 'react';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export const emptyShiftForm = {
  name: '',
  startTime: '',
  endTime: '',
  isActive: true,
};

export function shiftToForm(shift) {
  if (!shift) return { ...emptyShiftForm };
  return {
    name: shift.name ?? '',
    startTime: shift.startTime ?? '',
    endTime: shift.endTime ?? '',
    isActive: shift.isActive !== false,
  };
}

export default function ShiftEditDialog({ open, onOpenChange, shift, onSaved }) {
  const [form, setForm] = useState(() => shiftToForm(shift));
  const [saving, setSaving] = useState(false);
  const editId = shift?.id ?? null;

  useLayoutEffect(() => {
    if (!open) return;
    if (shift) setForm(shiftToForm(shift));
  }, [open, shift?.id, shift?.updated_date, shift]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên ca');
      return;
    }
    if (!form.startTime || !form.endTime) {
      toast.error('Vui lòng nhập giờ bắt đầu và kết thúc');
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        isActive: !!form.isActive,
      };

      if (editId) await base44.entities.Shift.update(editId, data);
      else await base44.entities.Shift.create(data);

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading italic text-2xl">
            {editId ? 'Chỉnh sửa ca' : 'Thêm ca làm việc'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editId ? 'Cập nhật thông tin ca làm việc' : 'Thêm ca làm việc mới'}
          </DialogDescription>
        </DialogHeader>

        <div key={editId ?? 'new'} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Tên ca *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Ca sáng"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Giờ bắt đầu *</label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Giờ kết thúc *</label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="shift-edit-isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="shift-edit-isActive" className="text-sm">Đang áp dụng</label>
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
