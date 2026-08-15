import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import ShiftEditDialog from '@/components/admin/ShiftEditDialog';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DashboardMobileList, DashboardMobileCard } from '@/components/dashboard/MobileDataCard';

export default function AdminShiftSettings({ role = 'admin' }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);

  const load = () => base44.entities.Shift.list('startTime').then((d) => {
    setShifts(d);
    setLoading(false);
  });

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingShift(null);
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditingShift(s);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open) => {
    setDialogOpen(open);
    if (!open) setEditingShift(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa ca này?')) return;
    await base44.entities.Shift.delete(id);
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <DashboardLayout role={role}>
      <PageHeader
        title="Ca làm việc"
        subtitle={`${shifts.length} ca đã cấu hình`}
        action={(
          <Button onClick={openCreate} className="bg-primary text-primary-foreground">
            <Plus size={16} className="mr-1" /> Thêm ca
          </Button>
        )}
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <DashboardMobileList loading={loading} empty={!loading && shifts.length === 0}>
          {shifts.map((s) => (
            <DashboardMobileCard
              key={s.id}
              title={s.name}
              subtitle={`${s.startTime} – ${s.endTime}`}
              badges={(
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {s.isActive ? 'Đang áp dụng' : 'Đã tắt'}
                </span>
              )}
              actions={(
                <>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil size={14} className="mr-1" /> Sửa</Button>
                  <Button variant="ghost" size="sm" className="text-destructive ml-auto" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></Button>
                </>
              )}
            />
          ))}
        </DashboardMobileList>

        <div className="dashboard-table-wrap hidden md:block">
          <table className="dashboard-table">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[30%]">Tên ca</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[20%]">Giờ bắt đầu</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[20%]">Giờ kết thúc</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[15%]">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[15%]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : shifts.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.startTime}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.endTime}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                      {s.isActive ? 'Đang áp dụng' : 'Đã tắt'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></Button>
                  </td>
                </tr>
              ))}
              {!loading && shifts.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Chưa có ca nào được cấu hình</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShiftEditDialog
        key={editingShift?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        shift={editingShift}
        onSaved={load}
      />
    </DashboardLayout>
  );
}
