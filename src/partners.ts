import './typography.ts';
import './styles.css';
import { sendInquiry } from './partner-form.ts';
import type { Inquiry } from './partner-form.ts';

const form = document.querySelector<HTMLFormElement>('.partners-form');
if (form) {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const status = form.querySelector<HTMLParagraphElement>('[role="alert"]')!;
  const endpoint = form.dataset.endpoint;
  const buttonHtml = button.innerHTML;
  let busy = false;
  let lastPayload = '';
  let requestId = '';
  if (endpoint) button.disabled = false;

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!form || busy || !endpoint || !form.reportValidity()) return;
    const data = new FormData(form);
    const inquiry: Inquiry = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      company: String(data.get('company') ?? '').trim(),
      role: String(data.get('role') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
      website: String(data.get('website') ?? ''),
    };
    const payload = JSON.stringify(inquiry);
    // A retry after a network timeout reuses the key; edited data starts a new inquiry.
    if (payload !== lastPayload) { requestId = crypto.randomUUID(); lastPayload = payload; }
    busy = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.hidden = true;
    try {
      await sendInquiry(endpoint, inquiry, requestId);
      window.location.assign(form.dataset.successUrl!);
    } catch (error) {
      status.textContent = error instanceof Error && error.name !== 'TimeoutError' && error.name !== 'TypeError'
        ? error.message : 'We couldn’t confirm your submission. Please try again or email contact@melonite.ai.';
      status.hidden = false;
      status.focus();
    } finally {
      busy = false;
      button.disabled = false;
      button.innerHTML = buttonHtml;
      form.removeAttribute('aria-busy');
    }
  }
  form.addEventListener('submit', onSubmit);
  if (import.meta.hot) import.meta.hot.dispose(() => form.removeEventListener('submit', onSubmit));
}
