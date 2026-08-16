/** Main site URL (non-blog). Dev: localhost:5174; LAN: same host without blog. prefix */
export function getHomeUrl() {
  const env = import.meta.env.VITE_HOME_URL?.trim();
  if (env) return env.replace(/\/$/, '');

  if (typeof window === 'undefined') return 'https://theraderma.vn';

  const { protocol, hostname, port } = window.location;
  let mainHost = hostname;
  if (hostname.startsWith('blog.')) {
    mainHost = hostname.slice(5);
    const nipMatch = mainHost.match(/^(\d+\.\d{1,3}\.\d{1,3}\.\d{1,3})\.nip\.io$/);
    if (nipMatch) mainHost = `${nipMatch[1]}.nip.io`;
  }
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//${mainHost}${portSuffix}`;
}
