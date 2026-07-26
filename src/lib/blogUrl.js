const PRIVATE_IP_RE =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;

export function isBlogHostname(hostname) {
  return hostname === 'blog.localhost' || hostname.startsWith('blog.');
}

/** Blog URL that works on localhost and LAN (uses blog.<ip>.nip.io on private IPs). */
export function getBlogUrl(location = typeof window !== 'undefined' ? window.location : null) {
  const env = import.meta.env.VITE_BLOG_URL?.trim();
  if (!location) return env || 'http://blog.localhost:5174';

  const { hostname, port, protocol } = location;
  const portSuffix = port ? `:${port}` : '';

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return env || `${protocol}//blog.localhost${portSuffix || ':5174'}`;
  }

  if (isBlogHostname(hostname)) {
    return `${protocol}//${hostname}${portSuffix}`;
  }

  if (PRIVATE_IP_RE.test(hostname)) {
    return `${protocol}//blog.${hostname}.nip.io${portSuffix}`;
  }

  const nipMatch = hostname.match(/^(\d+\.\d{1,3}\.\d{1,3}\.\d{1,3})\.nip\.io$/);
  if (nipMatch) {
    return `${protocol}//blog.${nipMatch[1]}.nip.io${portSuffix}`;
  }

  return env || `${protocol}//blog.${hostname}${portSuffix}`;
}

export function getBlogAdminUrl(location) {
  return `${getBlogUrl(location)}/admin/newsroom`;
}
