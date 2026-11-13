interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  RESEND_API_KEY: string;
  ALLOWED_ORIGIN: string;
  FROM_EMAIL: string;
  TO_EMAIL: string;
  IP_RATE_LIMITER: RateLimiter;
  SITE_RATE_LIMITER: RateLimiter;
}

type Fetcher = typeof fetch;
const maxBodyBytes = 16_384;
const uuid = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

function response(status: number, data: object, origin?: string): Response {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return Response.json(data, { status, headers });
}

async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get('Content-Length')) > maxBodyBytes) throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) { await reader.cancel(); throw new RangeError(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function field(data: Record<string, unknown>, key: string, limit: number, optional = false): string | null {
  const raw = data[key];
  if (optional && raw === undefined) return '';
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if ((!optional && !value) || value.length > limit) return null;
  const controls = key === 'message' ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
  return controls.test(value) ? null : value;
}

export async function handleRequest(request: Request, env: Env, send: Fetcher = fetch): Promise<Response> {
  const path = new URL(request.url).pathname;
  const configured = Boolean(env.RESEND_API_KEY && env.ALLOWED_ORIGIN && env.FROM_EMAIL && env.TO_EMAIL && env.IP_RATE_LIMITER && env.SITE_RATE_LIMITER);
  if (path === '/health' && request.method === 'GET') {
    return response(configured ? 200 : 503, { ok: configured, service: 'melonite-partners' });
  }
  if (path !== '/inquiry') return response(404, { error: 'Not found.' });
  const origin = request.headers.get('Origin');
  if (!origin || origin !== env.ALLOWED_ORIGIN) return response(403, { error: 'This form is only available on the Melonite website.' });
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600',
      Vary: 'Origin',
    } });
  }
  if (request.method !== 'POST') return response(405, { error: 'Please submit the form using POST.' }, origin);
  if (!configured) return response(503, { error: 'The form is temporarily unavailable. Please email contact@melonite.ai.' }, origin);
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return response(415, { error: 'Please send the form as JSON.' }, origin);
  }
  try {
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip) return response(503, { error: 'The form is temporarily unavailable. Please email contact@melonite.ai.' }, origin);
    const allowed = await env.IP_RATE_LIMITER.limit({ key: `partners:${ip}` });
    if (!allowed.success) return response(429, { error: 'Please wait a minute before trying again.' }, origin);
    let input: unknown;
    try { input = await readBody(request); }
    catch (error) { return response(error instanceof RangeError ? 413 : 400, { error: 'Please check the form and try again.' }, origin); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return response(400, { error: 'Please check the form and try again.' }, origin);
    const data = input as Record<string, unknown>;
    if (data.website !== undefined && data.website !== '') return response(400, { error: 'Unable to submit this inquiry.' }, origin);
    const name = field(data, 'name', 120);
    const email = field(data, 'email', 254);
    const company = field(data, 'company', 160);
    const role = field(data, 'role', 160);
    const message = field(data, 'message', 4000, true);
    if (name === null || email === null || company === null || role === null || message === null ||
        !/^[^\s@<>(),;:"\\]+@[^\s@<>(),;:"\\]+\.[^\s@<>(),;:"\\]+$/.test(email) ||
        typeof data.requestId !== 'string' || !uuid.test(data.requestId)) {
      return response(400, { error: 'Please enter your name, a valid email, company, and role.' }, origin);
    }
    const capacity = await env.SITE_RATE_LIMITER.limit({ key: 'partners:all' });
    if (!capacity.success) return response(429, { error: 'We’re receiving several inquiries. Please try again in a minute.' }, origin);
    const upstream = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `partners/${data.requestId}`,
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.TO_EMAIL],
        reply_to: email,
        subject: 'Melonite partnership inquiry',
        text: `Full name: ${name}\nEmail: ${email}\nCompany: ${company}\nRole: ${role}\n\nMessage:\n${message || '(No message provided)'}`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const result = await upstream.json().catch(() => null) as { id?: unknown } | null;
    if (!upstream.ok || typeof result?.id !== 'string' || !result.id) {
      return response(502, { error: 'We couldn’t confirm your submission. Please try again or email contact@melonite.ai.' }, origin);
    }
    return response(200, { ok: true }, origin);
  } catch {
    // Never return provider responses or log submitted data, email addresses, or keys.
    return response(503, { error: 'We couldn’t confirm your submission. Please try again or email contact@melonite.ai.' }, origin);
  }
}

export default { fetch: (request: Request, env: Env) => handleRequest(request, env) };
