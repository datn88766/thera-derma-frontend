import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { base44 } from '@/api/entities';
import { format, getDaysInMonth, startOfMonth, getDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Users, X, ChevronLeft, ChevronRight, CheckCircle2,
  Clock, XCircle, Umbrella, Calendar, Loader2, TrendingUp, Plus, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Số ngày làm việc trong tháng (trừ Chủ nhật)
function getWorkingDays(year, month) {
  const days = getDaysInMonth(new Date(year, month - 1));
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const dow = getDay(new Date(year, month - 1, d)); // 0=Sun
    if (dow !== 0) count++;
  }
  return count;
}

const STATUS_ICON = {
  present: <CheckCircle2 size={14} className="text-green-600" />,
  late: <Clock size={14} className="text-yellow-600" />,
  absent: <XCircle size={14} className="text-red-500" />,
  leave: <Umbrella size={14} className="text-blue-500" />,
};

const STATUS_LABEL = {
  present: 'Đúng giờ',
  late: 'Đi muộn',
  absent: 'Nghỉ',
  leave: 'Nghỉ phép',
};

const STATUS_COLOR = {
  present: 'bg-green-100 text-green-700 border-green-200',
  late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  absent: 'bg-red-100 text-red-600 border-red-200',
  leave: 'bg-blue-100 text-blue-700 border-blue-200',
};

function StatusChip({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {STATUS_ICON[status]}
      {STATUS_LABEL[status] || status}
    </span>
  );
}

// Modal Chấm Công Thủ Công cho Admin
function ManualAttendanceModal({ isOpen, onClose, users, initialUser, initialDate, onSuccess }) {
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('present');
  const [checkInTime, setCheckInTime] = useState('08:00');
  const [checkOutTime, setCheckOutTime] = useState('17:00');
  const [shiftId, setShiftId] = useState('');
  const [shifts, setShifts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUserId(initialUser?.id || (users[0]?.id ?? ''));
      setDate(initialDate || format(new Date(), 'yyyy-MM-dd'));
      setStatus('present');
      setError('');
      base44.entities.Shift.list()
        .then(res => {
          const list = Array.isArray(res) ? res : res?.items ?? [];
          setShifts(list);
          if (list.length > 0) {
            const first = list[0];
            setShiftId(first.id);
            if (first.startTime) setCheckInTime(first.startTime.slice(0, 5));
            if (first.endTime) setCheckOutTime(first.endTime.slice(0, 5));
          } else {
            setCheckInTime('08:00');
            setCheckOutTime('17:00');
          }
        })
        .catch(() => {
          setCheckInTime('08:00');
          setCheckOutTime('17:00');
        });
    }
  }, [isOpen, initialUser, initialDate, users]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError('Vui lòng chọn nhân viên');
      return;
    }
    if (!date) {
      setError('Vui lòng chọn ngày chấm công');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await base44.entities.Attendance.createManual({
        userId,
        date,
        status,
        checkInTime: checkInTime ? (checkInTime.length === 5 ? `${checkInTime}:00` : checkInTime) : undefined,
        checkOutTime: checkOutTime ? (checkOutTime.length === 5 ? `${checkOutTime}:00` : checkOutTime) : undefined,
        shiftId: shiftId || undefined,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err?.message || 'Có lỗi xảy ra khi cập nhật chấm công');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            <h3 className="font-semibold text-foreground text-lg">Chấm công thủ công</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-red-100 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Chọn nhân viên */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Nhân viên <span className="text-red-500">*</span>
            </label>
            <select
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
              required
            >
              <option value="" disabled>-- Chọn nhân viên --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Ngày chấm công */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Ngày chấm công <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
              required
            />
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'present', label: 'Đúng giờ', cls: 'border-green-300 text-green-700 bg-green-50' },
                { id: 'late', label: 'Đi muộn', cls: 'border-yellow-300 text-yellow-700 bg-yellow-50' },
                { id: 'absent', label: 'Nghỉ', cls: 'border-red-300 text-red-700 bg-red-50' },
                { id: 'leave', label: 'Nghỉ phép', cls: 'border-blue-300 text-blue-700 bg-blue-50' },
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    status === st.id ? `${st.cls} ring-2 ring-primary/40` : 'border-border text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  {STATUS_ICON[st.id]}
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Giờ vào & Giờ ra */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Giờ vào</label>
              <input
                type="time"
                value={checkInTime}
                onChange={e => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Giờ ra</label>
              <input
                type="time"
                value={checkOutTime}
                onChange={e => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Ca làm việc */}
          {shifts.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Ca làm việc</label>
              <select
                value={shiftId}
                onChange={e => {
                  const val = e.target.value;
                  setShiftId(val);
                  const selectedShift = shifts.find(s => s.id === val);
                  if (selectedShift) {
                    if (selectedShift.startTime) setCheckInTime(selectedShift.startTime.slice(0, 5));
                    if (selectedShift.endTime) setCheckOutTime(selectedShift.endTime.slice(0, 5));
                  }
                }}
                className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary"
              >
                <option value="">-- Tự động khớp ca --</option>
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Lưu chấm công
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AttendanceSlider({ employee, onClose, users }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const all = await base44.entities.Attendance.filter({ userId: employee.id }, '-date', 200);
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    setRecords(all.filter(r => r.date?.startsWith(monthStr)));
    setLoading(false);
  }, [employee.id, year, month]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const openManualForDate = (dateStr) => {
    setSelectedDate(dateStr);
    setModalOpen(true);
  };

  const workingDays = getWorkingDays(year, month);
  const presentCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const leaveCount = records.filter(r => r.status === 'leave').length;
  const workedCount = presentCount + lateCount + leaveCount; // "đủ công"

  // Build calendar grid
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDow = getDay(startOfMonth(new Date(year, month - 1))); // 0=Sun
  const recordMap = {};
  records.forEach(r => { if (r.date) recordMap[r.date] = r; });

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 right-0 h-full w-full md:w-[540px] bg-background border-l border-border shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold">
              {(employee.full_name || 'U')[0]}
            </div>
            <div>
              <p className="font-semibold text-foreground">{employee.full_name}</p>
              <p className="text-xs text-muted-foreground">{employee.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openManualForDate(format(new Date(), 'yyyy-MM-dd'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={14} /> Chấm công
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-muted/30">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground">
            Tháng {month} / {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-3 px-6 pt-5 pb-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-green-600 mb-1"><CheckCircle2 size={12} /> Đúng giờ</div>
                  <p className="text-2xl font-bold text-green-700">{presentCount}</p>
                  <p className="text-xs text-green-600/70">ngày</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-yellow-600 mb-1"><Clock size={12} /> Đi muộn</div>
                  <p className="text-2xl font-bold text-yellow-700">{lateCount}</p>
                  <p className="text-xs text-yellow-600/70">ngày</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mb-1"><XCircle size={12} /> Nghỉ (không phép)</div>
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                  <p className="text-xs text-red-600/70">ngày</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-1"><Umbrella size={12} /> Nghỉ phép</div>
                  <p className="text-2xl font-bold text-blue-700">{leaveCount}</p>
                  <p className="text-xs text-blue-600/70">ngày</p>
                </div>
              </div>

              {/* Đủ công */}
              <div className="mx-6 mb-4 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <TrendingUp size={15} />
                  <span>Đủ công tháng này</span>
                </div>
                <span className="text-lg font-bold text-primary">{workedCount} / {workingDays} <span className="text-xs font-normal">ngày công</span></span>
              </div>

              {/* Calendar grid */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lịch tháng (Click để chấm công)</p>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {dayNames.map(d => (
                    <div key={d} className={`text-center text-[11px] font-semibold pb-1 ${d === 'CN' ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {d}
                    </div>
                  ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for first week */}
                  {Array.from({ length: firstDow }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const rec = recordMap[dateStr];
                    const dow = getDay(new Date(year, month - 1, day));
                    const isSunday = dow === 0;

                    let cellCls = 'bg-muted/40 text-muted-foreground hover:bg-muted/80 cursor-pointer';
                    let dot = null;
                    if (rec) {
                      if (rec.status === 'present') { cellCls = 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'; dot = 'bg-green-500'; }
                      else if (rec.status === 'late') { cellCls = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer'; dot = 'bg-yellow-500'; }
                      else if (rec.status === 'absent') { cellCls = 'bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer'; dot = 'bg-red-500'; }
                      else if (rec.status === 'leave') { cellCls = 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'; dot = 'bg-blue-500'; }
                    } else if (isSunday) {
                      cellCls = 'bg-muted/20 text-red-300 hover:bg-muted/50 cursor-pointer';
                    }

                    return (
                      <button
                        key={day}
                        onClick={() => openManualForDate(dateStr)}
                        className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all ${cellCls}`}
                        title={rec ? `${STATUS_LABEL[rec.status]} — Vào: ${rec.checkInTime?.slice(0,5) || '—'} Ra: ${rec.checkOutTime?.slice(0,5) || '—'}` : (isSunday ? 'Chủ nhật (Click để chấm công)' : 'Chưa chấm công (Click để thêm)')}
                      >
                        <span>{day}</span>
                        {dot && <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${dot}`} />}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {STATUS_ICON[k]} {v}
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily detail list */}
              {records.length > 0 && (
                <div className="border-t border-border">
                  <div className="px-6 pt-4 pb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chi tiết từng ngày</p>
                  </div>
                  <div className="divide-y divide-border/60">
                    {records.sort((a, b) => b.date?.localeCompare(a.date)).map(rec => (
                      <div key={rec.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors group">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {rec.date ? format(parseISO(rec.date), 'EEEE, dd/MM/yyyy', { locale: vi }) : rec.date}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Vào: {rec.checkInTime?.slice(0,5) || '—'} · Ra: {rec.checkOutTime?.slice(0,5) || '—'}
                            {rec.shiftName ? ` · ${rec.shiftName}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusChip status={rec.status} />
                          <button
                            onClick={() => openManualForDate(rec.date)}
                            className="p-1 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            title="Sửa chấm công"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      <ManualAttendanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        users={users}
        initialUser={employee}
        initialDate={selectedDate}
        onSuccess={fetchRecords}
      />
    </>
  );
}

export default function AdminAttendance() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [globalModalOpen, setGlobalModalOpen] = useState(false);

  const fetchUsers = useCallback(() => {
    base44.entities.User.filter({ role: 'staff' })
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items ?? [];
        setUsers(items.filter((u) => u.role === 'staff'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter(
    (u) =>
      u.role === 'staff' &&
      (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <DashboardLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý chấm công</h1>
            <p className="text-muted-foreground text-sm mt-1">Xem báo cáo chấm công hoặc thêm chấm công thủ công cho nhân viên</p>
          </div>
          <button
            onClick={() => setGlobalModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto"
          >
            <Plus size={16} /> Chấm công thủ công
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {filtered.length} nhân viên
              </p>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Không tìm thấy nhân viên</div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors group"
                  >
                    <button
                      onClick={() => setSelected(u)}
                      className="flex items-center gap-4 flex-1 min-w-0 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {(u.full_name || 'U')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Nhân viên
                      </span>
                      <button
                        onClick={() => setSelected(u)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                      >
                        <Calendar size={14} /> Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Attendance Modal (Global) */}
      <ManualAttendanceModal
        isOpen={globalModalOpen}
        onClose={() => setGlobalModalOpen(false)}
        users={users}
        initialUser={null}
        initialDate={format(new Date(), 'yyyy-MM-dd')}
        onSuccess={() => {
          if (selected) {
            // Refetch if slider open
          }
        }}
      />

      {/* Slider overlay */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40"
            />
            <AttendanceSlider
              employee={selected}
              onClose={() => setSelected(null)}
              users={users}
            />
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}