import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { base44 } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { format, differenceInBusinessDays, parseISO, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Plus, Umbrella, Clock, CheckCircle2, XCircle,
  Loader2, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

const LEAVE_TYPE_LABEL = {
  annual: 'Nghỉ phép năm',
  sick: 'Nghỉ bệnh',
  personal: 'Việc cá nhân',
  unpaid: 'Nghỉ không lương',
  other: 'Khác',
};

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  approved: { label: 'Đã duyệt', cls: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  rejected: { label: 'Từ chối', cls: 'bg-red-100 text-red-600 border-red-200', icon: XCircle },
  cancelled: { label: 'Đã hủy', cls: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

function calcDays(start, end) {
  if (!start || !end) return 0;
  let count = 0;
  let cur = parseISO(start);
  const last = parseISO(end);
  while (cur <= last) {
    const dow = cur.getDay();
    if (dow !== 0) count++; // exclude Sunday
    cur = addDays(cur, 1);
  }
  return count;
}

const defaultForm = {
  startDate: '',
  endDate: '',
  leaveType: 'annual',
  reason: '',
};

export default function ManagerLeave() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await base44.entities.LeaveRequest.filter({ userId: user.id }, '-created_date', 50);
    setRequests(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await base44.entities.LeaveRequest.create({
      startDate: form.startDate,
      endDate: form.endDate,
      leaveType: form.leaveType,
      reason: form.reason || '',
    });
    setForm(defaultForm);
    setShowForm(false);
    await fetchRequests();
    setSubmitting(false);
  };

  const totalDaysPreview = calcDays(form.startDate, form.endDate);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedDays = requests.filter(r => r.status === 'approved').reduce((s, r) => s + (r.totalDays || 0), 0);

  return (
    <DashboardLayout role="staff">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Nghỉ phép</h1>
            <p className="text-sm text-muted-foreground mt-1">Gửi và theo dõi đơn xin nghỉ phép của bạn</p>
          </div>
          <Button onClick={() => setShowForm(v => !v)} className="w-full sm:w-auto flex items-center justify-center gap-2">
            <Plus size={16} /> Xin nghỉ phép
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Chờ duyệt</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{approvedDays}</p>
            <p className="text-xs text-muted-foreground mt-1">Ngày đã được duyệt</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{requests.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Tổng đơn</p>
          </div>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm"
            >
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Umbrella size={16} className="text-primary" /> Đơn xin nghỉ phép mới
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Từ ngày *</label>
                    <input type="date" required value={form.startDate}
                      onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      className="block w-full min-w-0 max-w-full appearance-none border border-border rounded-lg px-3 py-2 text-base sm:text-sm bg-background focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Đến ngày *</label>
                    <input type="date" required value={form.endDate} min={form.startDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className="block w-full min-w-0 max-w-full appearance-none border border-border rounded-lg px-3 py-2 text-base sm:text-sm bg-background focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                {totalDaysPreview > 0 && (
                  <p className="text-xs text-primary font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> Tổng: {totalDaysPreview} ngày công (không tính Chủ nhật)
                  </p>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Loại nghỉ phép *</label>
                  <select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary">
                    {Object.entries(LEAVE_TYPE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Lý do *</label>
                  <textarea required rows={3} value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    placeholder="Mô tả lý do xin nghỉ phép..."
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary resize-none"
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-full sm:w-auto">Huỷ</Button>
                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto flex items-center justify-center gap-2">
                    {submitting && <Loader2 size={14} className="animate-spin" />} Gửi đơn
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lịch sử đơn nghỉ phép</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Chưa có đơn nghỉ phép nào</div>
          ) : (
            <div className="divide-y divide-border">
              {requests.map(req => (
                <div key={req.id}>
                  <button
                    className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  >
                    <div className="flex items-start gap-3 min-w-0 w-full">
                      <Umbrella size={15} className="text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {LEAVE_TYPE_LABEL[req.leaveType]} · {req.totalDays} ngày
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {req.startDate} → {req.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      <StatusChip status={req.status} />
                      {expandedId === req.id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedId === req.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pt-1 bg-muted/20 space-y-2 text-sm">
                          <div><span className="text-muted-foreground">Lý do: </span>{req.reason}</div>
                          {req.adminNote && (
                            <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
                              <span className="font-semibold text-muted-foreground">Ghi chú admin: </span>{req.adminNote}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Gửi lúc: {req.created_date ? format(new Date(req.created_date), 'dd/MM/yyyy HH:mm') : '—'}
                          </div>
                          {req.status === 'pending' && (
                            <div className="pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/40 hover:bg-destructive/5"
                                onClick={async () => {
                                  if (!window.confirm('Hủy đơn nghỉ phép này?')) return;
                                  await base44.entities.LeaveRequest.cancel(req.id);
                                  await fetchRequests();
                                }}
                              >
                                Hủy đơn
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
