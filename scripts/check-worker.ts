import assert from 'node:assert/strict';
import { appendFile } from 'node:fs/promises';

const worker = new URL(process.env.WORKER_URL ?? '');
assert(worker.protocol === 'https:' && worker.hostname.startsWith('melonite-partners.') && worker.hostname.endsWith('.workers.dev'), 'Expected the deployed Melonite Worker URL.');
assert(!worker.username && !worker.password && !worker.search && !worker.hash, 'Unexpected Worker URL.');
let ready = false;
for (let attempt = 0; attempt < 10; attempt++) {
  try {
    const response = await fetch(new URL('/health', worker), { signal: AbortSignal.timeout(5000) });
    const body = await response.json() as { ok?: boolean; service?: string };
    if (response.ok && body.ok && body.service === 'melonite-partners') { ready = true; break; }
  } catch { /* The first deployment can take a moment to propagate. */ }
  await new Promise((resolve) => setTimeout(resolve, 3000));
}
assert(ready, 'Email Worker did not become ready; the website will not deploy.');
const endpoint = new URL('/inquiry', worker).href;
const invalid = await fetch(endpoint, {
  method: 'POST', headers: { Origin: 'https://melonite.ai', 'Content-Type': 'application/json' },
  body: '{}', signal: AbortSignal.timeout(5000),
});
assert.equal(invalid.status, 400, 'Worker must reject incomplete submissions without sending email.');
assert.equal(invalid.headers.get('Access-Control-Allow-Origin'), 'https://melonite.ai');
if (process.env.GITHUB_ENV) await appendFile(process.env.GITHUB_ENV, `PARTNERS_ENDPOINT=${endpoint}\n`);
console.log(`Email Worker ready: ${endpoint}. Health and validation checked without sending an email.`);
