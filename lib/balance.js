export const ENDPOINT = 'https://api.ikuncode.cc/api/usage/token/';
export const STATUS_ENDPOINT = 'https://api.ikuncode.cc/api/status';
export const MAX_BYTES = 65536;
export function numeric(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
export function parseBalance(body, quotaPerUnit) {
  if (body?.code !== true && body?.success !== true) throw new Error('payload');
  if (body?.code === false || body?.success === false) throw new Error('payload');
  const quota = numeric(body?.data?.user_quota?.total_available);
  if (quota === null || !Number.isFinite(quotaPerUnit) || quotaPerUnit <= 0) throw new Error('payload');
  return { total: quota / quotaPerUnit, currency: 'CNY' };
}
export function trusted(req) {
  const host = req.headers.host;
  if (typeof host !== 'string') return false;
  let url;
  try { url = new URL('http://' + host); } catch { return false; }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return false;
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  if (req.headers.origin) {
    try { if (new URL(req.headers.origin).host !== url.host) return false; } catch { return false; }
  }
  return true;
}
export async function readJson(response) {
  if (!response.ok) throw new Error('http');
  if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('payload');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('payload');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('payload');
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function queryBalance(key, fetchImpl = fetch) {
  const options = { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15000) };
  // No credentials on public status; do not assume other New API sites share this currency conversion.
  const status = await readJson(await fetchImpl(STATUS_ENDPOINT, options));
  const unit = numeric(status?.data?.quota_per_unit);
  if (status?.success !== true || status?.data?.quota_display_type !== 'CNY' || unit === null || unit <= 0 || numeric(status?.data?.usd_exchange_rate) !== 1) throw new Error('currency');
  const body = await readJson(await fetchImpl(ENDPOINT, {
    ...options, signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json', Authorization: `Bearer ${key}` },
  }));
  return parseBalance(body, unit);
}
