import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../worker/index.ts';
import { sendInquiry } from '../src/partner-form.ts';

const origin = 'https://melonite.ai';
const requestId = 'cf7995ad-fc4b-42f1-b0ee-9933bfdd2228';
const inquiry = { name: 'Test Person', email: 'person@example.com', company: 'Example Co', role: 'Research lead', message: '', website: '' };
const accepted = { limit: async () => ({ success: true }) };
function env(overrides = {}) {
  return { RESEND_API_KEY: 'test-key-not-real', ALLOWED_ORIGIN: origin, FROM_EMAIL: 'Melonite Website <website@melonite.ai>', TO_EMAIL: 'contact@melonite.ai', IP_RATE_LIMITER: accepted, SITE_RATE_LIMITER: accepted, ...overrides };
}
function request(data = { ...inquiry, requestId }, options = {}) {
  return new Request('https://worker.example/inquiry', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...options.headers },
    body: options.body ?? JSON.stringify(data),
  });
}
const noSend = async () => { assert.fail('Rejected or health requests must not call Resend.'); };

test('server sends all five fields with a fixed sender/recipient and the visitor as Reply-To', async () => {
  let calls = 0;
  const result = await handleRequest(request({ ...inquiry, requestId, to: 'attacker@example.com', from: 'attacker@example.com' }), env(), async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.resend.com/emails');
    const body = JSON.parse(init.body);
    assert.equal(body.from, 'Melonite Website <website@melonite.ai>');
    assert.deepEqual(body.to, ['contact@melonite.ai']);
    assert.equal(body.reply_to, inquiry.email);
    assert.match(body.text, /Full name: Test Person\nEmail: person@example.com\nCompany: Example Co\nRole: Research lead/);
    assert.match(body.text, /\(No message provided\)/);
    assert.equal(init.headers['Idempotency-Key'], `partners/${requestId}`);
    assert.equal(init.headers.Authorization, 'Bearer test-key-not-real');
    return Response.json({ id: 'accepted-email-id' });
  });
  assert.equal(calls, 1);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true });
  assert.equal(result.headers.get('Access-Control-Allow-Origin'), origin);
});

test('rejects missing fields, invalid email, header injection, bad types, and oversize field values', async (t) => {
  for (const change of [{ name: ' ' }, { email: 'invalid' }, { email: 'x@example.com\r\nBcc: other@example.com' }, { role: 42 }, { company: '' }, { name: 'x'.repeat(121) }, { message: 'x'.repeat(4001) }, { requestId: 'not-a-uuid' }]) {
    await t.test(JSON.stringify(change).slice(0, 65), async () => {
      const result = await handleRequest(request({ ...inquiry, requestId, ...change }), env(), noSend);
      assert.equal(result.status, 400);
    });
  }
});

test('rejects foreign origins, wrong media types, malformed JSON, and oversized bodies', async () => {
  assert.equal((await handleRequest(request(undefined, { headers: { Origin: 'https://unrelated.example' } }), env(), noSend)).status, 403);
  assert.equal((await handleRequest(request(undefined, { headers: { 'Content-Type': 'text/plain' } }), env(), noSend)).status, 415);
  assert.equal((await handleRequest(request(undefined, { body: '{broken' }), env(), noSend)).status, 400);
  assert.equal((await handleRequest(request(undefined, { body: 'x'.repeat(16385) }), env(), noSend)).status, 413);
});

test('rate limits and the spam trap prevent outgoing email', async () => {
  const blocked = { limit: async () => ({ success: false }) };
  assert.equal((await handleRequest(request(), env({ IP_RATE_LIMITER: blocked }), noSend)).status, 429);
  assert.equal((await handleRequest(request(), env({ SITE_RATE_LIMITER: blocked }), noSend)).status, 429);
  assert.equal((await handleRequest(request({ ...inquiry, requestId, website: 'spam' }), env(), noSend)).status, 400);
});

test('preflight and health work without sending, and missing configuration fails closed', async () => {
  const preflight = new Request('https://worker.example/inquiry', { method: 'OPTIONS', headers: { Origin: origin } });
  const result = await handleRequest(preflight, env(), noSend);
  assert.equal(result.status, 204);
  assert.equal(result.headers.get('Access-Control-Allow-Methods'), 'POST');
  const health = new Request('https://worker.example/health');
  assert.equal((await handleRequest(health, env(), noSend)).status, 200);
  assert.equal((await handleRequest(health, env({ RESEND_API_KEY: '' }), noSend)).status, 503);
  assert.equal((await handleRequest(request(), env({ IP_RATE_LIMITER: undefined }), noSend)).status, 503);
});

test('provider errors and timeouts cannot be reported as success or expose provider details', async () => {
  for (const provider of [async () => Response.json({ error: 'private provider error' }, { status: 403 }), async () => { throw new Error('private provider error'); }, async () => Response.json({})]) {
    const response = await handleRequest(request(), env(), provider);
    assert(response.status >= 500);
    const text = await response.text();
    assert(!text.includes('private provider error'));
    assert(!text.includes('test-key-not-real'));
  }
});

test('frontend-to-Worker submission succeeds only on acknowledgement and preserves retry identifiers', async () => {
  const seen = [];
  const send = async (_url, init) => {
    seen.push(JSON.parse(init.body).requestId);
    const res = await handleRequest(request(JSON.parse(init.body)), env(), async () => Response.json({ id: 'accepted-email-id' }));
    return res;
  };
  await sendInquiry('https://worker.example/inquiry', inquiry, requestId, send);
  await sendInquiry('https://worker.example/inquiry', inquiry, requestId, send);
  assert.deepEqual(seen, [requestId, requestId]);
  await assert.rejects(sendInquiry('https://worker.example/inquiry', inquiry, requestId, async () => Response.json({ error: 'Try again.' }, { status: 502 })), /Try again/);
  await assert.rejects(sendInquiry('https://worker.example/inquiry', inquiry, requestId, async () => Response.json({})), /couldn’t confirm/);
});
