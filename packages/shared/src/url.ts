/**
 * Job URL normalization, to avoid creating duplicates.
 * Strips tracking parameters, hash, www and trailing slash; sorts the remaining parameters.
 */

const TRACKING_PARAMS = new Set([
  'gclid',
  'fbclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'ref',
  'refid',
  'referrer',
  'source',
  'si',
  'trk',
  'trkemail',
  'trackingid',
  'tracking_id',
  'lipi',
  'originalsubdomain',
]);

function isTracking(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith('utm_') || TRACKING_PARAMS.has(lower);
}

/** Returns the canonical URL, or null if the string does not look like an http(s) link. */
export function normalizeJobUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.host.toLowerCase().replace(/^www\./, '');
  if (!url.hostname.includes('.')) return null;

  // LinkedIn: canonical form by job ID.
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) {
    const fromParam = url.searchParams.get('currentJobId');
    const fromPath = /\/jobs\/view\/(?:[^/?]*-)?(\d{6,})/.exec(url.pathname)?.[1];
    const id = fromParam ?? fromPath;
    if (id) return `https://linkedin.com/jobs/view/${id}`;
  }

  const kept: [string, string][] = [];
  url.searchParams.forEach((value, key) => {
    if (!isTracking(key)) kept.push([key, value]);
  });
  kept.sort(([a], [b]) => a.localeCompare(b));

  const search = new URLSearchParams(kept).toString();
  const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : '';

  return `https://${host}${pathname}${search ? `?${search}` : ''}`;
}

/** Whether two URLs point to the same job. */
export function isSameJobUrl(a: string, b: string): boolean {
  const na = normalizeJobUrl(a);
  const nb = normalizeJobUrl(b);
  return na !== null && na === nb;
}
