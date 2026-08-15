const PRIVATE_IP_RE =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;

function makeSubdomainHelpers(prefix, envVar) {
  function isHostname(hostname) {
    return hostname === `${prefix}.localhost` || hostname.startsWith(`${prefix}.`);
  }

  function getUrl(location = typeof window !== 'undefined' ? window.location : null) {
    const env = import.meta.env[envVar]?.trim();
    if (!location) return env || `http://${prefix}.localhost:5174`;

    const { hostname, port, protocol } = location;
    const portSuffix = port ? `:${port}` : '';

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return env || `${protocol}//${prefix}.localhost${portSuffix || ':5174'}`;
    }

    if (isHostname(hostname)) {
      return `${protocol}//${hostname}${portSuffix}`;
    }

    if (PRIVATE_IP_RE.test(hostname)) {
      return `${protocol}//${prefix}.${hostname}.nip.io${portSuffix}`;
    }

    const nipMatch = hostname.match(/^(\d+\.\d{1,3}\.\d{1,3}\.\d{1,3})\.nip\.io$/);
    if (nipMatch) {
      return `${protocol}//${prefix}.${nipMatch[1]}.nip.io${portSuffix}`;
    }

    return env || `${protocol}//${prefix}.${hostname}${portSuffix}`;
  }

  return { isHostname, getUrl };
}

const admin = makeSubdomainHelpers('admin', 'VITE_ADMIN_URL');
const attendance = makeSubdomainHelpers('attendance', 'VITE_ATTENDANCE_URL');

export const isAdminHostname = admin.isHostname;
export const getAdminUrl = admin.getUrl;
export const isAttendanceHostname = attendance.isHostname;
export const getAttendanceUrl = attendance.getUrl;
