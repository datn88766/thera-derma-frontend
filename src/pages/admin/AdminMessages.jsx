import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import { base44 } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, MessageSquare } from 'lucide-react';

const triggerLabels = {
  welcome: 'Chào mừng khách mới',
  service_inquiry: 'Hỏi về dịch vụ',
  booking_confirm: 'Xác nhận đặt lịch',
  treatment_reminder: 'Nhắc liệu trình',
  product_inquiry: 'Hỏi về sản phẩm',
};
const emptyForm = { trigger: 'welcome', content: '', description: '', isActive: true };

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => base44.entities.AutomatedMessage.list().then(d => { setMessages(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (m) => {
    setForm({
      trigger: m.trigger,
      content: m.content || '',
      description: m.description || '',
      isActive: !!m.isActive,
    });
    setEditId(m.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      trigger: form.trigger,
      content: form.content,
      description: form.description || '',
      isActive: !!form.isActive,
    };
    if (editId) await base44.entities.AutomatedMessage.update(editId, payload);
    else await base44.entities.AutomatedMessage.create(payload);
    await load();
    setDialogOpen(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa tin nhắn này?')) return;
    await base44.entities.AutomatedMessage.delete(id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const toggleActive = async (m) => {
    await base44.entities.AutomatedMessage.update(m.id, { isActive: !m.isActive });
    setMessages(prev => prev.map(x => x.id === m.id ? { ...x, isActive: !x.isActive } : x));
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Tin nhắn tự động"
        subtitle="Quản lý các mẫu phản hồi tự động cho chatbot"
        action={<Button onClick={openCreate} className="bg-primary text-primary-foreground"><Plus size={16} className="mr-1" /> Thêm mẫu</Button>}
      />

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {messages.map(msg => (
            <div key={msg.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                    {triggerLabels[msg.trigger] || msg.trigger}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">{msg.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(msg)}><Pencil size={13} /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(msg.id)}><Trash2 size={13} /></Button>
                </div>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 flex items-start gap-2">
                <MessageSquare size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs font-medium ${msg.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {msg.isActive ? '● Đang hoạt động' : '○ Đã tắt'}
                </span>
                <button onClick={() => toggleActive(msg)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {msg.isActive ? 'Tắt' : 'Bật'}
                </button>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">Chưa có mẫu tin nhắn nào</div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading italic text-2xl">{editId ? 'Chỉnh sửa' : 'Thêm mẫu tin nhắn'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Kích hoạt khi</label>
              <Select value={form.trigger} onValueChange={v => setForm({ ...form, trigger: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs text-muted-foreground">Mô tả (để dễ quản lý)</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <label className="text-xs text-muted-foreground">Nội dung tin nhắn *</label>
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                rows={5}
                className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor="isActive" className="text-sm">Kích hoạt ngay</label>
            </div>
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