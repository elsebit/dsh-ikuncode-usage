import { credentialRef } from '@deepseek-ai/dsh-credentials';
import z from '@deepseek-ai/schemastery';
import { trusted, queryBalance } from './balance.js';
export const name = 'elsebit-ikuncode-usage';
export const inject = ['credentials', 'webServer'];
export const Config = z.object({
  credentialRef: z.string().default('IKUNCODE_API_KEY').description('IKunCode API key credential reference (not the key itself).'),
});
const messages = {
  noKey: 'IKunCode credential is not configured',
  badConfig: 'Invalid credential reference',
  failed: 'Balance query failed. Check your key, network, and account quota-query permissions.',
};
export function apply(ctx, config = {}) {
  let cache = null;
  let pending = null;
  const send = (res, status, body) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/api/elsebit-ikuncode-usage',
    handler: async (req, res) => {
      if (!trusted(req)) return send(res, 403, { ok: false });
      if (req.method !== 'GET') return send(res, 405, { ok: false });
      const ref = config.credentialRef ?? 'IKUNCODE_API_KEY';
      if (typeof ref !== 'string' || !/^[A-Z_][A-Z0-9_]{0,127}$/.test(ref)) return send(res, 200, { ok: false, message: messages.badConfig });
      try {
        const credential = await ctx.credentials.resolve(credentialRef(ref));
        const key = credential?.value?.trim();
        if (typeof key !== 'string' || !/^[\x21-\x7e]+$/.test(key)) return send(res, 200, { ok: false, message: messages.noKey });
        // Key never leaves the host. Cache identity includes the actual key so rotations cannot reuse stale balances.
        const bucket = ref + '\0' + key;
        if (cache?.bucket === bucket && Date.now() - cache.at < 30000) return send(res, 200, { ok: true, ...cache.result });
        if (!pending || pending.bucket !== bucket) {
          const promise = queryBalance(key).then((balance) => {
            const result = { provider: 'IKunCode', balance, updatedAt: Date.now() };
            cache = { bucket, at: Date.now(), result };
            return result;
          });
          pending = { bucket, promise };
          promise.finally(() => { if (pending?.promise === promise) pending = null; }).catch(() => {});
        }
        const result = await pending.promise;
        return send(res, 200, { ok: true, ...result });
      } catch {
        // Do not return/log exception strings: upstream libraries may embed Authorization values.
        return send(res, 200, { ok: false, message: messages.failed });
      }
    },
  }), 'IKunCode balance endpoint');
}
