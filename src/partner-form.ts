export interface Inquiry {
  name: string;
  email: string;
  company: string;
  role: string;
  message: string;
  website: string;
}

export async function sendInquiry(endpoint: string, inquiry: Inquiry, requestId: string, send: typeof fetch = fetch): Promise<void> {
  const response = await send(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify({ ...inquiry, requestId }),
    signal: AbortSignal.timeout(20_000),
  });
  const result = await response.json().catch(() => null) as { ok?: unknown; error?: unknown } | null;
  if (!response.ok || result?.ok !== true) {
    throw new Error(typeof result?.error === 'string' ? result.error : 'We couldn’t confirm your submission. Please try again or email contact@melonite.ai.');
  }
}
