import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Clock } from 'lucide-react';

function toMinutes(time) {
  const [h, m] = time.slice(0, 5).split(':').map((n) => parseInt(n, 10));
  return h * 60 + m;
}

// Ca có [startTime, endTime) chứa giờ hiện tại được ưu tiên gợi ý; nếu không
// ca nào chứa thì gợi ý ca có giờ bắt đầu gần nhất — nhưng nhân viên vẫn
// luôn được tự chọn để tránh bị tính nhầm sang ca trước chưa hết giờ.
function suggestShiftId(shifts, now) {
  if (!shifts.length) return null;
  const t = toMinutes(now);
  const containing = shifts.find((s) => {
    const start = toMinutes(s.startTime);
    const end = toMinutes(s.endTime);
    return start <= t && t < end;
  });
  if (containing) return containing.id;
  const closest = shifts.reduce((best, s) =>
    Math.abs(toMinutes(s.startTime) - t) < Math.abs(toMinutes(best.startTime) - t)
      ? s
      : best,
  );
  return closest.id;
}

export default function ShiftSelectDialog({ open, onOpenChange, onConfirm, submitting }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    base44.entities.Shift.list('startTime').then((data) => {
      const active = data.filter((s) => s.isActive !== false);
      setShifts(active);
      setSelectedId(suggestShiftId(active, new Date().toTimeString().slice(0, 8)));
      setLoading(false);
    });
  }, [open]);

  const selectedShift = useMemo(
    () => shifts.find((s) => s.id === selectedId) ?? null,
    [shifts, selectedId],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading italic text-2xl">Chọn ca làm việc</DialogTitle>
          <DialogDescription>
            Chọn đúng ca bạn đang làm để tránh bị tính nhầm vào ca trước chưa hết giờ.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Chưa có ca làm việc nào đang áp dụng. Vui lòng liên hệ quản trị viên.
          </div>
        ) : (
          <RadioGroup value={selectedId ?? ''} onValueChange={setSelectedId} className="gap-3 py-2">
            {shifts.map((s) => (
              <label
                key={s.id}
                htmlFor={`shift-${s.id}`}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                  selectedId === s.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
                }`}
              >
                <RadioGroupItem value={s.id} id={`shift-${s.id}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{s.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock size={11} />
                    {s.startTime.slice(0, 5)} – {s.endTime.slice(0, 5)}
                  </div>
                </div>
              </label>
            ))}
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={() => onConfirm(selectedShift)}
            disabled={!selectedShift || submitting}
            className="bg-primary text-primary-foreground"
          >
            {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            Xác nhận check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
