import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { base44 } from '@/api/entities';
import { format } from 'date-fns';
import {
  Umbrella, CheckCircle2, XCircle, Clock, Loader2,
  ChevronDown, ChevronUp, Filter, Search
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

export default function AdminLeave() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const data = await base44.entities.LeaveRequest.list('-created_date', 200);
    setRequests(data);
    setLoading(false);
  };

  const handleAction = async (req, newStatus) => {
    setActionLoading(req.id + newStatus);
    await base44.entities.LeaveRequest.update(req.id, {
      status: newStatus,
      adminNote: adminNotes[req.id] || '',
    });
    await fetchAll();
    setExpandedId(null);
    setActionLoading(null);
  };

  const filtered = requests.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSearch = !search || r.userName?.toLowerCase().includes(search.toLowerCase()) || r.userEmail?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <DashboardLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý nghỉ phép</h1>
          <p className="text-sm text-muted-foreground mt-1">Duyệt và quản lý đơn xin nghỉ phép của nhân viên</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
            <p className="text-xs text-yellow-600 mt-1">Chờ duyệt</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
            <p className="text-xs text-green-600 mt-1">Đã duyệt</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            <p className="text-xs text-red-500 mt-1">Đã từ chối</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email nhân viên..."
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {s === 'all' ? 'Tất cả' : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {filtered.length} đơn
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Không có đơn nào</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(req => (
                <div key={req.id}>
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {(req.userName || 'U')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{req.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {LEAVE_TYPE_LABEL[req.leaveType]} · {req.totalDays} ngày · {req.startDate} → {req.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusChip status={req.status} />
                      {expandedId === req.id
                        ? <ChevronUp size={14} className="text-muted-foreground" />
                        : <ChevronDown size={14} className="text-muted-foreground" />}
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
                        <div className="px-5 pb-5 pt-2 bg-muted/20 space-y-4">
                          {/* Details */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-xs text-muted-foreground block mb-0.5">Nhân viên</span>
                              <p className="font-medium">{req.userName}</p>
                              <p className="text-xs text-muted-foreground">{req.userEmail}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block mb-0.5">Loại nghỉ</span>
                              <p className="font-medium">{LEAVE_TYPE_LABEL[req.leaveType]}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block mb-0.5">Thời gian</span>
                              <p className="font-medium">{req.startDate} → {req.endDate}</p>
                              <p className="text-xs text-muted-foreground">{req.totalDays} ngày công</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground block mb-0.5">Ngày gửi</span>
                              <p className="font-medium">
                                {req.created_date ? format(new Date(req.created_date), 'dd/MM/yyyy HH:mm') : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm">
                            <span className="text-xs font-semibold text-muted-foreground block mb-1">Lý do</span>
                            {req.reason}
                          </div>

                          {/* Admin note */}
                          {req.status === 'pending' && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                                Ghi chú (tuỳ chọn)
                              </label>
                              <textarea rows={2} value={adminNotes[req.id] || ''}
                                onChange={e => setAdminNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                                placeholder="Ghi chú khi duyệt hoặc từ chối..."
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary resize-none"
                              />
                            </div>
                          )}
                          {req.adminNote && req.status !== 'pending' && (
                            <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm">
                              <span className="text-xs font-semibold text-muted-foreground">Ghi chú admin: </span>{req.adminNote}
                            </div>
                          )}

                          {/* Action buttons */}
                          {req.status === 'pending' && (
                            <div className="flex gap-2 pt-1">
                              <Button
                                onClick={() => handleAction(req, 'approved')}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                              >
                                {actionLoading === req.id + 'approved'
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <CheckCircle2 size={13} />}
                                Duyệt
                              </Button>
                              <Button
                                onClick={() => handleAction(req, 'rejected')}
                                disabled={!!actionLoading}
                                variant="outline"
                                className="flex items-center gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                              >
                                {actionLoading === req.id + 'rejected'
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <XCircle size={13} />}
                                Từ chối
                              </Button>
                            </div>
                          )}
                          {req.status !== 'pending' && (
                            <div className="text-xs text-muted-foreground">
                              Đơn này đã được xử lý.{' '}
                              <button
                                className="text-primary underline"
                                onClick={() => handleAction(req, 'pending')}
                              >
                                Đặt lại thành chờ duyệt
                              </button>
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