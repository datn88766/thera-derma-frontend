export const COMPANY_LAT = parseFloat(import.meta.env.VITE_COMPANY_LAT ?? '20.939798552238788');
export const COMPANY_LNG = parseFloat(import.meta.env.VITE_COMPANY_LNG ?? '107.11506789954434');
export const MAX_DISTANCE_METERS = parseInt(import.meta.env.VITE_GEOFENCE_METERS ?? '300', 10);

export function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function checkGeolocationPermission() {
  if (!navigator.geolocation) return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  if (!navigator.permissions?.query) return 'prompt';
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    return 'prompt';
  }
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ định vị GPS.'));
      return;
    }
    if (!window.isSecureContext) {
      reject(new Error('Cần HTTPS để truy cập GPS. Vui lòng liên hệ quản trị viên.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === 1)
          reject(new Error('Đã từ chối quyền vị trí. Vui lòng bật lại trong Cài đặt trình duyệt → Quyền → Vị trí.'));
        else if (err.code === 2)
          reject(new Error('Không xác định được vị trí. Vui lòng thử lại hoặc kiểm tra GPS.'));
        else
          reject(new Error('Hết thời gian chờ vị trí. Vui lòng thử lại.'));
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 },
    );
  });
}
