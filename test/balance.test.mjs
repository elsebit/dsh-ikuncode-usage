import test from 'node:test';
import assert from 'node:assert/strict';
import { numeric, parseBalance, trusted, queryBalance, readJson, MAX_BYTES, ENDPOINT, STATUS_ENDPOINT } from '../lib/balance.js';

test('numeric rejects absent and non-finite quota', () => {
  for (const v of [null, undefined, false, '', ' ', Infinity, 'bad', {}]) assert.equal(numeric(v), null);
});
test('account quota only; preserve zero and debt', () => {
  for (const q of [0, -500000, '1250000']) assert.equal(parseBalance({ code: true, data: { user_quota: { total_available: q } } }, 500000).total, Number(q) / 500000);
  assert.throws(() => parseBalance({ code: true, data: { total_available: 9000000 } }, 500000));
  assert.throws(() => parseBalance({ code: true, success: false, data: { user_quota: { total_available: 1 } } }, 500000));
});
test('loopback and same-origin checks', () => {
  assert.equal(trusted({ headers: { host: '127.0.0.1:1234', origin: 'http://127.0.0.1:1234' } }), true);
  for (const headers of [{ host: 'evil.example' }, { host: '127.0.0.1', origin: 'https://evil.example' }, { host: 'localhost', 'sec-fetch-site': 'cross-site' }]) assert.equal(trusted({ headers }), false);
});
test('fixed origins; public status never receives key; no redirects', async () => {
  const calls = [];
  const result = await queryBalance('synthetic-key', async (url, init) => {
    calls.push(url);
    assert.equal(init.method, 'GET'); assert.equal(init.redirect, 'error');
    if (url === STATUS_ENDPOINT) {
      assert.equal(init.headers, undefined);
      return Response.json({ success: true, data: { quota_per_unit: 500000, quota_display_type: 'CNY', usd_exchange_rate: 1 } });
    }
    assert.equal(url, ENDPOINT); assert.equal(init.headers.Authorization, 'Bearer synthetic-key');
    return Response.json({ code: true, data: { user_quota: { total_available: 1250000 } } });
  });
  assert.deepEqual(result, { total: 2.5, currency: 'CNY' }); assert.equal(calls.length, 2);
});
test('changed currency conversion fails closed without querying account', async () => {
  let calls = 0;
  await assert.rejects(queryBalance('synthetic-key', async () => { calls++; return Response.json({ success: true, data: { quota_per_unit: 500000, quota_display_type: 'USD', usd_exchange_rate: 7 } }); }));
  assert.equal(calls, 1);
});
test('bounded body and HTTP errors', async () => {
  await assert.rejects(readJson(new Response('x'.repeat(MAX_BYTES + 1))));
  await assert.rejects(readJson(new Response('{}', { status: 401 })));
  await assert.rejects(readJson(new Response('not json')));
});
