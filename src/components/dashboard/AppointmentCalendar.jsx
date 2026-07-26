import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/entities';
import { ChevronLeft, ChevronRight, X, Phone, Mail, Clock, User, CalendarDays } from 'lucide-react';

const MONTH_NAMES = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5',
  'Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10',
  'Tháng 11','Tháng 12',
];
const DOW = ['T2','T3','T4','T5','T6','T7','CN'];

const STATUS_LABEL = {
  pending:   'Chờ làm',
  confirmed: 'Đang làm',
  completed: 'Đã xong',
  cancelled: 'Đã hủy',
  noshow:    'Không đến',
};

const STATUS_COLOR = {
  pending:   'bg-orange-100 text-orange-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  noshow:    'bg-gray-100 text-gray-700',
};

// Available next-status actions per current status
const NEXT_ACTIONS = {
  pending: [
    { to: 'confirmed', label: 'Đang làm', cls: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { to: 'cancelled', label: 'Hủy lịch',  cls: 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200' },
  ],
  confirmed: [
    { to: 'completed', label: 'Đã xong',  cls: 'bg-green-500 hover:bg-green-600 text-white' },
    { to: 'cancelled', label: 'Hủy lịch', cls: 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200' },
  ],
};

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

// ── Postpone sub-dialog ─────────────────────────────────────────────────────

function PostponeDialog({ appt, onConfirm, onCancel, saving }) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" onClick={onCancel}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading italic text-lg mb-1">Hoãn lịch hẹn</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Khách: <span className="font-medium text-foreground">{appt.customerName}</span>
          {' — '}Ngày hiện tại: <span className="font-medium text-foreground">{fmtDate(appt.date)}</span> {appt.time}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Ngày hẹn lại <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ghi chú (tuỳ chọn)</label>
            <textarea
              rows={3}
              placeholder="Lý do hoãn, yêu cầu đặc biệt..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(date, note)}
            disabled={!date || saving}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Đang xử lý...' : 'Xác nhận hoãn'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Appointment card inside day dialog ─────────────────────────────────────

function ApptCard({ appt, onStatusChange, onPostpone, updating }) {
  const actions = NEXT_ACTIONS[appt.status] ?? [];
  const canPostpone = appt.status === 'pending' || appt.status === 'confirmed';

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-background">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight truncate">{appt.customerName}</p>
            <p className="text-xs text-muted-foreground">{appt.time}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[appt.status] ?? 'bg-muted text-muted-foreground'}`}>
          {STATUS_LABEL[appt.status] ?? appt.status}
        </span>
      </div>

      {/* Contact */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone size={12} className="flex-shrink-0" />
          <span>{appt.customerPhoneNumber}</span>
        </div>
        {appt.customerEmail && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail size={12} className="flex-shrink-0" />
            <span className="truncate">{appt.customerEmail}</span>
          </div>
        )}
      </div>

      {/* Services */}
      {appt.serviceNames?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {appt.serviceNames.map((s, i) => (
            <span key={i} className="text-xs bg-primary/8 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {appt.notes && (
        <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">{appt.notes}</p>
      )}

      {/* Actions */}
      {(actions.length > 0 || canPostpone) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {actions.map(({ to, label, cls }) => (
            <button
              key={to}
              onClick={() => onStatusChange(appt, to)}
              disabled={updating}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${cls}`}
            >
              {label}
            </button>
          ))}
          {canPostpone && (
            <button
              onClick={() => onPostpone(appt)}
              disabled={updating}
              className="text-xs px-3 py-1.5 rounded-lg font-medium bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 transition-colors disabled:opacity-50"
            >
              Hoãn lịch
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Day dialog ──────────────────────────────────────────────────────────────

function DayDialog({ date, appointments, onClose, onReload }) {
  const [localAppts, setLocalAppts] = useState(appointments);
  const [updatingId, setUpdatingId] = useState(null);
  const [postponeAppt, setPostponeAppt] = useState(null);
  const [postponeSaving, setPostponeSaving] = useState(false);

  useEffect(() => { setLocalAppts(appointments); }, [appointments]);

  const handleStatusChange = async (appt, newStatus) => {
    setUpdatingId(appt.id);
    try {
      await base44.entities.Appointment.update(appt.id, { status: newStatus });
      setLocalAppts(prev => prev.map(a => a.id === appt.id ? { ...a, status: newStatus } : a));
      onReload();
    } catch (err) {
      alert(err?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePostponeConfirm = async (targetDate, note) => {
    const appt = postponeAppt;
    setPostponeSaving(true);
    try {
      const noteCancel = `Hoãn sang ngày ${fmtDate(targetDate)}${note ? '. ' + note : ''}`;
      const noteCreate = `Dời từ ngày ${fmtDate(appt.date)}${note ? '. ' + note : ''}`;

      await base44.entities.Appointment.update(appt.id, { status: 'cancelled', notes: noteCancel });

      await base44.entities.Appointment.createAdmin({
        customerMode: appt.customerId ? 'existing' : 'guest',
        ...(appt.customerId ? { customerId: appt.customerId } : {}),
        customerName: appt.customerName,
        customerPhoneNumber: appt.customerPhoneNumber,
        ...(appt.customerEmail ? { customerEmail: appt.customerEmail } : {}),
        serviceNames: appt.serviceNames ?? [],
        date: targetDate,
        time: appt.time,
        status: 'confirmed',
        notes: noteCreate,
      });

      setLocalAppts(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'cancelled', notes: noteCancel } : a));
      setPostponeAppt(null);
      onReload();
    } catch (err) {
      alert(err?.message || 'Không thể hoãn lịch');
    } finally {
      setPostponeSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
        <div
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Dialog header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-primary" />
              <h2 className="font-heading italic text-lg">Ngày {fmtDate(date)}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Appointment list */}
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {localAppts.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Không có lịch hẹn trong ngày này</p>
            ) : (
              localAppts.map(appt => (
                <ApptCard
                  key={appt.id}
                  appt={appt}
                  onStatusChange={handleStatusChange}
                  onPostpone={setPostponeAppt}
                  updating={updatingId === appt.id}
                />
              ))
            )}
          </div>

          {/* Footer count */}
          {localAppts.length > 0 && (
            <div className="px-5 py-3 border-t border-border flex-shrink-0">
              <p className="text-xs text-muted-foreground">{localAppts.length} lịch hẹn</p>
            </div>
          )}
        </div>
      </div>

      {postponeAppt && (
        <PostponeDialog
          appt={postponeAppt}
          onConfirm={handlePostponeConfirm}
          onCancel={() => setPostponeAppt(null)}
          saving={postponeSaving}
        />
      )}
    </>
  );
}

// ── Main calendar ───────────────────────────────────────────────────────────

export default function AppointmentCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const loadMonth = useCallback(async (y, m) => {
    setLoading(true);
    const mm = String(m + 1).padStart(2, '0');
    const lastDay = new Date(y, m + 1, 0).getDate();
    const dateFrom = `${y}-${mm}-01`;
    const dateTo = `${y}-${mm}-${String(lastDay).padStart(2, '0')}`;
    try {
      const result = await base44.entities.Appointment.filter({ dateFrom, dateTo }, '-date', 500);
      setAppointments(Array.isArray(result) ? result : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMonth(year, month); }, [year, month, loadMonth]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // Days with active (non-cancelled) appointments
  const activeDates = new Set(
    appointments.filter(a => a.status !== 'cancelled').map(a => a.date)
  );

  // Build calendar grid (Monday-first)
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDow = (firstDayOfMonth.getDay() + 6) % 7; // 0=Mon
  const totalCells = Math.ceil((firstDow + lastDayOfMonth.getDate()) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const d = i - firstDow + 1;
    return (d < 1 || d > lastDayOfMonth.getDate()) ? null : d;
  });

  const td = todayStr();
  const selectedAppts = selectedDate
    ? appointments.filter(a => a.date === selectedDate)
    : [];

  const toDateStr = (d) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-heading italic text-xl">Lịch hẹn</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            aria-label="Tháng trước"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            aria-label="Tháng sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Day-of-week row */}
        <div className="grid grid-cols-7 mb-2">
          {DOW.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const dateStr = toDateStr(d);
              const hasAppts = activeDates.has(dateStr);
              const isToday = dateStr === td;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={i}
                  onClick={() => { setSelectedDate(dateStr); }}
                  className={[
                    'relative flex flex-col items-center justify-center rounded-lg aspect-square text-sm transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold ring-2 ring-primary/40'
                      : isToday
                      ? 'bg-primary/10 text-primary font-semibold hover:bg-primary/20'
                      : hasAppts
                      ? 'hover:bg-muted/60 font-medium'
                      : 'hover:bg-muted/40 text-muted-foreground',
                  ].join(' ')}
                >
                  {d}
                  {hasAppts && (
                    <span className={[
                      'absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full',
                      isSelected ? 'bg-primary-foreground' : 'bg-emerald-500',
                    ].join(' ')} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Có lịch hẹn
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-4 h-4 rounded-md bg-primary/10 inline-block" />
            Hôm nay
          </div>
        </div>
      </div>

      {/* Day dialog */}
      {selectedDate && (
        <DayDialog
          date={selectedDate}
          appointments={selectedAppts}
          onClose={() => setSelectedDate(null)}
          onReload={() => loadMonth(year, month)}
        />
      )}
    </div>
  );
}
