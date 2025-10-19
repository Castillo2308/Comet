import axios from 'axios';
import { google } from 'googleapis';

function getGmailOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getGmailJwtClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  // For Gmail via service account, you MUST impersonate a Workspace user
  const subject = process.env.GOOGLE_IMPERSONATE_EMAIL || process.env.GMAIL_SENDER_EMAIL || '';
  // Service Accounts cannot impersonate consumer @gmail.com accounts
  if (subject && /@gmail\.com$/i.test(subject)) return null;
  if (!clientEmail || !privateKey || !subject) return null;
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject,
  });
}

async function sendWithGmailServiceAccount({ to, subject, html }) {
  const auth = getGmailJwtClient();
  if (!auth) return { ok: false, reason: 'no-gmail-jwt' };
  const gmail = google.gmail({ version: 'v1', auth });

  const fromEmail = process.env.GMAIL_SENDER_EMAIL || process.env.GOOGLE_IMPERSONATE_EMAIL || '';
  const fromName = process.env.MAIL_FROM_NAME || 'COMET';
  const fromHeader = fromEmail ? `${fromName} <${fromEmail}>` : fromName;
  const replyTo = process.env.MAIL_REPLY_TO || '';

  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;

  const headers = [
    'MIME-Version: 1.0',
    `To: ${to}`,
    `From: ${fromHeader}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodedSubject}`,
    'Content-Type: text/html; charset=UTF-8',
  ].filter(Boolean);

  const message = headers.join('\r\n') + '\r\n\r\n' + html;
  const raw = toBase64Url(Buffer.from(message, 'utf8'));

  try {
    const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
    if (res.status >= 200 && res.status < 300) return { ok: true };
    return { ok: false, status: res.status, reason: res.statusText };
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.warn('[verify] Gmail SA send error:', status, data?.error || data || String(e));
    return { ok: false, reason: 'gmail-jwt-error', status };
  }
}

async function sendWithGmail({ to, subject, html }) {
  const auth = getGmailOAuthClient();
  if (!auth) return { ok: false, reason: 'no-gmail-auth' };
  const gmail = google.gmail({ version: 'v1', auth });

  const fromEmail = process.env.GMAIL_SENDER_EMAIL || '';
  const fromName = process.env.MAIL_FROM_NAME || 'COMET';
  const fromHeader = fromEmail ? `${fromName} <${fromEmail}>` : fromName;
  const replyTo = process.env.MAIL_REPLY_TO || '';

  // Encode subject per RFC 2047 to be safe with non-ASCII
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;

  const headers = [
    'MIME-Version: 1.0',
    `To: ${to}`,
    `From: ${fromHeader}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodedSubject}`,
    'Content-Type: text/html; charset=UTF-8',
  ].filter(Boolean);

  const message = headers.join('\r\n') + '\r\n\r\n' + html;
  const raw = toBase64Url(Buffer.from(message, 'utf8'));

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    if (res.status >= 200 && res.status < 300) return { ok: true };
    return { ok: false, status: res.status, reason: res.statusText };
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.warn('[verify] Gmail send error:', status, data?.error || data || String(e));
    return { ok: false, reason: 'gmail-error', status };
  }
}

// Send a verification email using one of:
// - RESEND_API_KEY (preferred)
// - MAIL_WEBHOOK_URL (custom webhook that accepts { to, subject, html })
// If neither is configured, fallback logs the link to console.
export async function sendVerificationEmail({ to, verifyUrl, appName = 'COMET' }) {
  const subject = `${appName}: Verifica tu cuenta`;
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:auto;padding:16px">
      <h2 style="text-align:center;margin:8px 0 16px 0">${appName}</h2>
      <p>Gracias por registrarte. Para activar tu cuenta, haz clic en el siguiente botón:</p>
      <p style="margin:24px 0;text-align:center">
        <a href="${verifyUrl}" style="background:#1e40af;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block" target="_blank" rel="noreferrer">Verificar cuenta</a>
      </p>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p style="color:#6b7280;font-size:12px">Este enlace expira en 48 horas.</p>
    </div>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  const hook = process.env.MAIL_WEBHOOK_URL;

  try {
    // 1) Try Gmail via Service Account (Workspace + Domain-wide delegation)
    const saAttempt = await sendWithGmailServiceAccount({ to, subject, html });
    if (saAttempt.ok) return { ok: true };
    // 2) Try Gmail via OAuth2 refresh token (personal Gmail or Workspace)
    const gmailAttempt = await sendWithGmail({ to, subject, html });
    if (gmailAttempt.ok) return { ok: true };

    if (apiKey) {
      const from = process.env.MAIL_FROM || 'noreply@comet.local';
      const r = await axios.post('https://api.resend.com/emails', {
        from,
        to: [to],
        subject,
        html,
      }, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
        validateStatus: () => true,
      });
      if (r.status >= 200 && r.status < 300) {
        return { ok: true };
      } else {
        const msg = r.data?.message || r.data?.error || r.statusText;
        console.warn('[verify] Resend rejected message:', r.status, msg);
      }
    } else if (hook) {
      const r = await axios.post(hook, { to, subject, html }, { timeout: 10000, validateStatus: () => true });
      if (r.status >= 200 && r.status < 300) return { ok: true };
      console.warn('[verify] Mail webhook rejected message:', r.status, r.data?.message || r.statusText);
    }
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.warn('[verify] Email send error:', status, data?.message || String(e));
  }
  console.log(`[verify] Send email to ${to}: ${verifyUrl}`);
  return { ok: true, mocked: true };
}
