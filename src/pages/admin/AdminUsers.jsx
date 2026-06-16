import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Sparkles, CalendarDays, Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_PERMISSIONS = {
  admin: 'Toàn quyền: người dùng, khách hàng, dịch vụ, sản phẩm, blog, footer, cài đặt, xóa dữ liệu.',
  staff: 'Xem/sửa khách hàng, dịch vụ, sản phẩm, lịch hẹn, liệu trình. Không xóa, không quản users/footer.',
  customer: 'Xem lịch hẹn, liệu trình và thông báo của chính mình.',
};

const EMPTY_FORM = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  role: 'customer',
  status: 'active',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState({ appointments: [], treatments: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.User.list();
      setUsers(Array.isArray(data) ? data : data?.items ?? []);
    } catch (e) {
      toast.error(e.message || 'Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter(
    (u) =>
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      fullName: user.full_name || '',
      email: user.email || '',
      password: '',
      phone: user.phoneNumber || user.phone || '',
      role: user.role || 'customer',
      status: user.status || 'active',
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.fullName?.trim() || !form.email?.trim()) {
      toast.error('Vui lòng nhập tên và email');
      return;
    }
    if (!editingUser && !form.password?.trim()) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const payload = {
          fullName: form.fullName.trim(),
          phone: form.phone || undefined,
          role: form.role,
          status: form.status,
        };
        await base44.entities.User.update(editingUser.id, payload);
        toast.success('Đã cập nhật người dùng');
      } else {
        await base44.entities.User.create({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone || undefined,
          role: form.role,
        });
        toast.success('Đã tạo tài khoản mới');
      }
      setFormOpen(false);
      await loadUsers();
    } catch (err) {
      toast.error(err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.User.delete(deleteTarget.id);
      toast.success('Đã vô hiệu hóa tài khoản');
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const viewUserDetail = async (user) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const [appointments, treatments] = await Promise.all([
        base44.entities.Appointment.filter({ userId: user.id }, '-date', 20),
        base44.entities.TreatmentPlan.filter({ userId: user.id }),
      ]);
      setUserDetail({ appointments, treatments });
    } catch {
      setUserDetail({ appointments: [], treatments: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Quản lý người dùng"
        subtitle={`${users.length} tài khoản trong hệ thống`}
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} />
            Thêm người dùng
          </Button>
        }
      />

      <div className="mb-6 p-4 bg-muted/40 border border-border rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">Phân quyền theo vai trò</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
          {Object.entries(ROLE_PERMISSIONS).map(([role, desc]) => (
            <div key={role} className="flex gap-2 items-start">
              <StatusBadge status={role} />
              <span className="leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm tên, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Tên</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">SĐT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Vai trò</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Không có người dùng nào
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                            {(user.full_name || 'U')[0]}
                          </div>
                        )}
                        <span className="text-sm font-medium">{user.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.phoneNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.role || 'customer'} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status === 'active' ? 'account_active' : (user.status || 'account_active')} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => viewUserDetail(user)} title="Xem chi tiết">
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)} title="Sửa / phân quyền">
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(user)}
                          title="Vô hiệu hóa"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading italic text-xl">
              {editingUser ? 'Sửa người dùng' : 'Thêm người dùng mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Họ tên</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                disabled={!!editingUser}
                required
              />
            </div>
            {!editingUser && (
              <div>
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label>Vai trò (phân quyền)</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="customer">Khách hàng</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{ROLE_PERMISSIONS[form.role]}</p>
            </div>
            {editingUser && (
              <div>
                <Label>Trạng thái tài khoản</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
                    <SelectItem value="suspended">Tạm khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : editingUser ? 'Cập nhật' : 'Tạo tài khoản'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vô hiệu hóa tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản <strong>{deleteTarget?.full_name}</strong> ({deleteTarget?.email}) sẽ bị vô hiệu hóa (soft delete). Người dùng không thể đăng nhập nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Đang xóa...' : 'Vô hiệu hóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User detail */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading italic text-2xl">
              {selectedUser?.full_name || 'Chi tiết người dùng'}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">SĐT</p>
                  <p className="font-medium">{selectedUser?.phoneNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{selectedUser?.address || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vai trò</p>
                  <StatusBadge status={selectedUser?.role || 'customer'} />
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  Liệu trình ({userDetail.treatments.length})
                </h3>
                {userDetail.treatments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có liệu trình nào</p>
                ) : (
                  userDetail.treatments.map((t) => (
                    <div key={t.id} className="border border-border rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{t.name}</p>
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CalendarDays size={16} className="text-primary" />
                  Lịch hẹn ({userDetail.appointments.length})
                </h3>
                {userDetail.appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có lịch hẹn nào</p>
                ) : (
                  userDetail.appointments.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b border-border py-2 text-sm">
                      <span>
                        {a.date} {a.time}
                      </span>
                      <span className="text-muted-foreground">{a.serviceNames?.join(', ') || '—'}</span>
                      <StatusBadge status={a.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
