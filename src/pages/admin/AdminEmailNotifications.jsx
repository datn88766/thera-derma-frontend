import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Mail,
  Pencil,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  emailApi,
  EMAIL_TEMPLATE_LABELS,
  EMAIL_TEMPLATE_VARS,
} from '@/lib/emailTemplates';

const TRANSPORT_LABELS = {
  smtp: 'SMTP',
  resend: 'Resend API',
  dev: 'Chế độ dev (chỉ ghi log)',
};

const emptyForm = { subject: '', bodyHtml: '', isActive: true };

export default function AdminEmailNotifications() {
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editType, setEditType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testTemplate, setTestTemplate] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        emailApi.getSettings(),
        emailApi.listTemplates(),
      ]);
      setSettings(s);
      setTemplates(t);
    } catch (e) {
      toast.error(e.message || 'Không tải được cấu hình email');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await emailApi.verifyConnection();
      if (result.ok) {
        toast.success(`Kết nối ${TRANSPORT_LABELS[result.transport] || result.transport} thành công`);
      } else {
        toast.warning(result.message || 'Chưa cấu hình email');
      }
    } catch (e) {
      toast.error(e.message || 'Kiểm tra kết nối thất bại');
    } finally {
      setVerifying(false);
    }
  };

  const openEdit = (tpl) => {
    setForm({
      subject: tpl.subject || '',
      bodyHtml: tpl.bodyHtml || '',
      isActive: !!tpl.isActive,
    });
    setEditType(tpl.type);
    setDialogOpen(true);
  };

  const openPreview = async (type) => {
    try {
      const data = await emailApi.previewTemplate(type);
      setPreviewSubject(data.subject);
      setPreviewHtml(data.html);
      setPreviewOpen(true);
    } catch (e) {
      toast.error(e.message || 'Không tải được xem trước');
    }
  };

  const handleSave = async () => {
    if (!form.subject.trim() || !form.bodyHtml.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    setSaving(true);
    try {
      await emailApi.updateTemplate(editType, {
        subject: form.subject,
        bodyHtml: form.bodyHtml,
        isActive: form.isActive,
      });
      await load();
      setDialogOpen(false);
      toast.success('Đã lưu mẫu email');
    } catch (e) {
      toast.error(e.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (tpl) => {
    try {
      await emailApi.updateTemplate(tpl.type, { isActive: !tpl.isActive });
      setTemplates((prev) =>
        prev.map((x) =>
          x.type === tpl.type ? { ...x, isActive: !x.isActive } : x,
        ),
      );
    } catch (e) {
      toast.error(e.message || 'Cập nhật thất bại');
    }
  };

  const handleSendTest = async () => {
    if (!testTo.trim()) {
      toast.error('Vui lòng nhập email nhận thử');
      return;
    }
    setSendingTest(true);
    try {
      await emailApi.sendTest({
        to: testTo.trim(),
        templateType: testTemplate || undefined,
      });
      toast.success('Đã gửi email thử nghiệm');
    } catch (e) {
      toast.error(e.message || 'Gửi thử thất bại');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Thông báo Email"
        subtitle="Cấu hình SMTP và quản lý mẫu email gửi tới khách hàng"
        action={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw size={16} className="mr-1" />
            Tải lại
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Trạng thái gửi email</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {settings?.configured ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle2 size={14} />
                        {TRANSPORT_LABELS[settings.transport] || settings.transport}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <AlertCircle size={14} />
                        Chưa cấu hình — email chỉ ghi log trên server
                      </span>
                    )}
                  </p>
                  <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                    <p>Gửi từ: <span className="text-foreground">{settings?.from}</span></p>
                    {settings?.smtpHost && (
                      <p>SMTP: {settings.smtpHost}{settings.smtpUser ? ` (${settings.smtpUser})` : ''}</p>
                    )}
                    {settings?.resendConfigured && !settings?.smtpHost && (
                      <p>Resend API đã cấu hình</p>
                    )}
                  </div>
                </div>
              </div>
              <Button onClick={handleVerify} disabled={verifying} variant="outline">
                {verifying ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-4">
              Cấu hình biến môi trường trên server: <code className="text-foreground">SMTP_HOST</code>,{' '}
              <code className="text-foreground">SMTP_USER</code>, <code className="text-foreground">SMTP_PASS</code>,{' '}
              <code className="text-foreground">EMAIL_FROM</code>. Hoặc dùng <code className="text-foreground">RESEND_API_KEY</code>.
            </p>
          </div>

          <div>
            <h3 className="font-heading italic text-xl mb-4">Mẫu thông báo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <div key={tpl.type} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                        {EMAIL_TEMPLATE_LABELS[tpl.type] || tpl.type}
                      </span>
                      <p className="text-sm font-medium mt-2">{tpl.subject}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openPreview(tpl.type)}
                        title="Xem trước"
                      >
                        <Eye size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(tpl)}
                      >
                        <Pencil size={13} />
                      </Button>
                    </div>
                  </div>
                  <div
                    className="bg-muted/40 rounded-lg p-3 text-sm leading-relaxed line-clamp-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: tpl.bodyHtml }}
                  />
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(EMAIL_TEMPLATE_VARS[tpl.type] || []).map((v) => (
                      <code key={v} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                        {v}
                      </code>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        tpl.isActive ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      {tpl.isActive ? '● Đang hoạt động' : '○ Đã tắt'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleActive(tpl)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {tpl.isActive ? 'Tắt' : 'Bật'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 md:p-6">
            <h3 className="font-heading italic text-xl mb-4">Gửi thử</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-1">
                <label className="text-xs text-muted-foreground">Email nhận</label>
                <Input
                  type="email"
                  placeholder="khach@example.com"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs text-muted-foreground">Mẫu (tùy chọn)</label>
                <Select value={testTemplate || '_raw'} onValueChange={(v) => setTestTemplate(v === '_raw' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Email thô" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_raw">Email thử nghiệm (không dùng mẫu)</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.type} value={t.type}>
                        {EMAIL_TEMPLATE_LABELS[t.type] || t.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSendTest}
                disabled={sendingTest}
                className="bg-primary text-primary-foreground"
              >
                <Send size={16} className="mr-1" />
                {sendingTest ? 'Đang gửi...' : 'Gửi thử'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading italic text-2xl">
              Chỉnh sửa — {EMAIL_TEMPLATE_LABELS[editType] || editType}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Tiêu đề email *</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nội dung HTML *</label>
              <Textarea
                value={form.bodyHtml}
                onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {(EMAIL_TEMPLATE_VARS[editType] || []).map((v) => (
                <code key={v} className="text-xs px-2 py-1 bg-muted rounded">
                  {v}
                </code>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emailActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <label htmlFor="emailActive" className="text-sm">
                Kích hoạt mẫu này
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-primary-foreground"
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading italic text-2xl">
              Xem trước — {previewSubject}
            </DialogTitle>
          </DialogHeader>
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            className="w-full flex-1 min-h-[420px] border border-border rounded-lg bg-white"
            sandbox=""
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
