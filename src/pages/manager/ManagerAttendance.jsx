import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { base44 } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import {
  COMPANY_LAT,
  COMPANY_LNG,
  MAX_DISTANCE_METERS,
  getDistanceMeters,
  getCurrentPosition,
  checkGeolocationPermission,
} from '@/lib/geolocation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  MapPin, Clock, CheckCircle2, LogIn, LogOut,
  AlertTriangle, Loader2, Calendar, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function StatusBadge({ status }) {
  const map = {
    present: { label: 'Đúng giờ', cls: 'bg-green-100 text-green-700' },
    late:    { label: 'Đi muộn',  cls: 'bg-yellow-100 text-yellow-700' },
    absent:  { label: 'Vắng',     cls: 'bg-red-100 text-red-700' },
  };
  const s = map[status] || map.present;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

// Banner hướng dẫn theo từng trạng thái quyền vị trí
function LocationBanner({ permission, onRequest, loading }) {
  if (permission === 'granted' || permission === 'mock') return null;

  if (permission === 'insecure') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Không thể truy cập vị trí</p>
            <p className="text-xs text-red-700/80 mt-1 leading-relaxed">
              Chức năng chấm công yêu cầu kết nối bảo mật. Vui lòng liên hệ quản trị viên để được hỗ trợ.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === 'unsupported') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            Trình duyệt này không hỗ trợ định vị GPS. Vui lòng dùng Chrome hoặc Safari mới nhất.
          </p>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <MapPin size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-900">Quyền vị trí bị từ chối</p>
            <p className="text-xs text-orange-700/80 mt-1 leading-relaxed">
              Vào <strong>Cài đặt trình duyệt → Quyền → Vị trí</strong>, tìm trang này và đổi sang <strong>Cho phép</strong>, sau đó tải lại trang.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onRequest}
          disabled={loading}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <MapPin size={14} className="mr-2" />}
          Thử lại
        </Button>
      </div>
    );
  }

  // permission === 'prompt' (chưa quyết định)
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <MapPin size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Cần quyền truy cập vị trí để chấm công</p>
          <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
            Hệ thống dùng GPS để xác nhận bạn đang trong vòng <strong>{MAX_DISTANCE_METERS}m</strong> quanh công ty.
            Nhấn nút bên dưới và chọn <strong>Cho phép</strong> khi trình duyệt hỏi.
          </p>
        </div>
      </div>
      <Button
        type="button"
        onClick={onRequest}
        disabled={loading}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <MapPin size={14} className="mr-2" />}
        Cho phép truy cập vị trí
      </Button>
    </div>
  );
}

export default function ManagerAttendance() {
  const { user } = useAuth();
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError]     = useState('');
  const [locPermission, setLocPermission] = useState('unknown');
  const [successMsg, setSuccessMsg] = useState('');
  const [now, setNow]               = useState(new Date());

  const today = format(new Date(), 'yyyy-MM-dd');

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Kiểm tra quyền vị trí khi mount
  useEffect(() => {
    checkGeolocationPermission().then(setLocPermission);

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => { result.onchange = () => setLocPermission(result.state); })
        .catch(() => {});
    }
  }, []);

  // Tự động hỏi quyền ngay khi phát hiện chưa chọn
  useEffect(() => {
    if (locPermission === 'prompt') requestLocationPermission();
  }, [locPermission]);

  useEffect(() => {
    if (!user) return;
    fetchRecords();
  }, [user]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.Attendance.filter({ userId: user.id }, '-date', 30);
    setRecords(data);
    setTodayRecord(data.find(r => r.date === today) ?? null);
    setLoading(false);
  }, [user, today]);

  // Khi user click "Cho phép" → trigger browser permission dialog (production)
  // hoặc xác nhận mock mode (LAN/dev)
  const requestLocationPermission = async () => {
    setLocError('');
    setLocLoading(true);
    try {
      await getCurrentPosition();
      setLocPermission('granted');
    } catch (e) {
      setLocError(e.message);
      setLocPermission('denied');
    } finally {
      setLocLoading(false);
    }
  };

  const doAttendance = async (action) => {
    setLocError('');
    setSuccessMsg('');
    setLocLoading(true);

    const pos = await getCurrentPosition().catch((e) => {
      setLocError(e.message);
      return null;
    });
    if (!pos) { setLocLoading(false); return; }

    const dist = getDistanceMeters(pos.lat, pos.lng, COMPANY_LAT, COMPANY_LNG);
    if (dist > MAX_DISTANCE_METERS) {
      setLocError(
        `Bạn đang cách công ty ${Math.round(dist)}m. Phải trong vòng ${MAX_DISTANCE_METERS}m mới được chấm công.`
      );
      setLocLoading(false);
      return;
    }

    try {
      if (action === 'in') {
        const checkInTime = format(new Date(), 'HH:mm:ss');
        const status = checkInTime > '09:00:00' ? 'late' : 'present';
        const rec = await base44.entities.Attendance.create({
          date: today,
          checkInTime,
          checkInLat: pos.lat,
          checkInLng: pos.lng,
          status,
        });
        setTodayRecord(rec);
        setRecords(prev => [rec, ...prev]);
        setSuccessMsg(`✅ Check-in lúc ${checkInTime} thành công! (cách công ty ${Math.round(dist)}m)`);
      } else {
        const checkOutTime = format(new Date(), 'HH:mm:ss');
        const updated = await base44.entities.Attendance.update(todayRecord.id, {
          checkOutTime,
          checkOutLat: pos.lat,
          checkOutLng: pos.lng,
        });
        setTodayRecord(updated);
        setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
        setSuccessMsg(`✅ Check-out lúc ${checkOutTime} thành công!`);
      }
    } catch (e) {
      setLocError(e.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLocLoading(false);
    }
  };

  const canCheckIn  = !todayRecord;
  const canCheckOut = todayRecord && !todayRecord.checkOutTime;
  const locReady    = locPermission === 'granted' || locPermission === 'unknown';

  const thisMonthRecords = records.filter(r => r.date?.startsWith(format(new Date(), 'yyyy-MM')));
  const presentCount     = thisMonthRecords.filter(r => r.status === 'present').length;
  const lateCount        = thisMonthRecords.filter(r => r.status === 'late').length;

  return (
    <DashboardLayout role="staff">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chấm công</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(now, 'EEEE, dd/MM/yyyy', { locale: vi })}
          </p>
        </div>

        {/* Permission banner */}
        <LocationBanner
          permission={locPermission}
          onRequest={requestLocationPermission}
          loading={locLoading}
        />

        {/* Clock + Action card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">

            {/* Clock */}
            <div className="text-center md:text-left">
              <div className="text-5xl font-mono font-bold text-foreground tabular-nums">
                {format(now, 'HH:mm:ss')}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2 justify-center md:justify-start">
                <MapPin size={13} className="text-primary" />
                <span>Thera Derma — {COMPANY_LAT.toFixed(4)}, {COMPANY_LNG.toFixed(4)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Bán kính cho phép: {MAX_DISTANCE_METERS}m
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:ml-auto w-full md:w-auto">
              <Button
                onClick={() => doAttendance('in')}
                disabled={!canCheckIn || locLoading || !locReady}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-5 rounded-xl disabled:opacity-40"
              >
                {locLoading && canCheckIn
                  ? <Loader2 size={16} className="animate-spin" />
                  : <LogIn size={16} />}
                Check-in
              </Button>
              <Button
                onClick={() => doAttendance('out')}
                disabled={!canCheckOut || locLoading || !locReady}
                variant="outline"
                className="flex items-center gap-2 border-orange-400 text-orange-600 hover:bg-orange-50 px-6 py-5 rounded-xl disabled:opacity-40"
              >
                {locLoading && canCheckOut
                  ? <Loader2 size={16} className="animate-spin" />
                  : <LogOut size={16} />}
                Check-out
              </Button>
            </div>
          </div>

          {/* Today status */}
          {todayRecord && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 size={14} /> Vào: <strong>{todayRecord.checkInTime?.slice(0, 5)}</strong>
              </span>
              {todayRecord.checkOutTime && (
                <span className="flex items-center gap-1.5 text-orange-600">
                  <Clock size={14} /> Ra: <strong>{todayRecord.checkOutTime?.slice(0, 5)}</strong>
                </span>
              )}
              <StatusBadge status={todayRecord.status} />
            </div>
          )}

          {/* Error / Success */}
          {locError && (
            <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{locError}</span>
            </div>
          )}
          {successMsg && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
              {successMsg}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp size={13} /> Tháng này
            </div>
            <div className="text-2xl font-bold text-foreground">{thisMonthRecords.length}</div>
            <div className="text-xs text-muted-foreground">ngày đã chấm</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle2 size={13} /> Đúng giờ
            </div>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <div className="text-xs text-muted-foreground">ngày</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock size={13} /> Đi muộn
            </div>
            <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
            <div className="text-xs text-muted-foreground">ngày</div>
          </div>
        </div>

        {/* History */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Lịch sử chấm công</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Chưa có dữ liệu chấm công</div>
          ) : (
            <div className="divide-y divide-border">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(rec.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <LogIn size={11} /> {rec.checkInTime?.slice(0, 5) || '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <LogOut size={11} /> {rec.checkOutTime?.slice(0, 5) || '—'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
