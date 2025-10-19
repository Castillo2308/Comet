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
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${appName} - Verificación de cuenta</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f8f9fa;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <div style="background-color:#f8f9fa;padding:32px 16px;min-height:100vh">
        <!-- Container principal -->
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.07);overflow:hidden">
          
          <!-- Header con gradiente -->
          <div style="background:linear-gradient(135deg,#1e40af 0%,#1e3a8a 100%);padding:40px 24px;text-align:center">
            <h1 style="margin:0;color:white;font-size:32px;font-weight:700">🔐 ${appName}</h1>
            <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px">Verificación de seguridad</p>
          </div>

          <!-- Contenido principal -->
          <div style="padding:40px 32px">
            
            <!-- Saludo personalizado -->
            <p style="margin:0 0 24px 0;font-size:16px;color:#1f2937;font-weight:500">
              ¡Hola, te damos la bienvenida a ${appName}!
            </p>

            <!-- Mensaje principal -->
            <div style="background-color:#f0f9ff;border-left:4px solid #1e40af;padding:16px;border-radius:6px;margin-bottom:32px">
              <p style="margin:0;color:#1e40af;font-size:14px;font-weight:600">
                📧 Se ha detectado un nuevo registro en tu cuenta. Para completar el registro y asegurar tu cuenta, necesitamos que verifiques tu dirección de correo electrónico.
              </p>
            </div>

            <!-- CTA Button - Diseño profesional -->
            <div style="text-align:center;margin:32px 0">
              <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e40af 0%,#1e3a8a 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(30,64,175,0.3);transition:all 0.3s ease" target="_blank" rel="noreferrer">
                ✓ Verificar mi cuenta
              </a>
              <p style="margin:12px 0 0 0;font-size:12px;color:#6b7280">
                Si el botón no funciona, copia el enlace de abajo en tu navegador
              </p>
            </div>

            <!-- Enlace alternativo en texto -->
            <div style="background-color:#f3f4f6;padding:16px;border-radius:8px;margin:24px 0;break-word:break-word">
              <p style="margin:0 0 8px 0;font-size:12px;color:#6b7280">
                <strong>Enlace de verificación:</strong>
              </p>
              <a href="${verifyUrl}" style="color:#1e40af;text-decoration:underline;font-size:12px;word-break:break-all" target="_blank" rel="noreferrer">
                ${verifyUrl}
              </a>
            </div>

            <!-- Información de seguridad -->
            <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:24px 0">
              <p style="margin:0;font-size:13px;color:#92400e">
                <strong>⚠️ Información de seguridad:</strong><br>
                Este enlace de verificación es personal y único. Nunca lo compartas con terceros. ${appName} nunca te pedirá tu contraseña por correo electrónico.
              </p>
            </div>

            <!-- Detalles técnicos -->
            <div style="background-color:#f9fafb;padding:16px;border-radius:8px;margin:24px 0;border:1px solid #e5e7eb">
              <p style="margin:0 0 12px 0;font-size:13px;color:#4b5563;font-weight:600">Detalles del registro:</p>
              <ul style="margin:0;padding-left:20px;font-size:12px;color:#6b7280">
                <li style="margin:4px 0">Email: <strong>${to}</strong></li>
                <li style="margin:4px 0">Plataforma: COMET - Comunicación Electrónica Municipal</li>
                <li style="margin:4px 0">Válido por: 48 horas desde el envío</li>
              </ul>
            </div>

            <!-- Información adicional -->
            <p style="margin:24px 0 0 0;font-size:13px;color:#6b7280;line-height:1.6">
              Si no solicitaste esta verificación o tienes dudas, puedes ignorar este correo o 
              <a href="https://comet.local" style="color:#1e40af;text-decoration:none" target="_blank">contactar con nuestro equipo de soporte</a>.
            </p>

          </div>

          <!-- Footer -->
          <div style="background-color:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280">
            <p style="margin:0 0 8px 0">
              © 2025 ${appName} - Comunicación Electrónica Municipal
            </p>
            <p style="margin:0;font-size:11px">
              Este es un correo automático. Por favor no respondas a este mensaje.
            </p>
          </div>

        </div>

        <!-- Espacios en blanco para compatibilidad -->
        <div style="margin-top:32px;text-align:center;font-size:12px;color:#9ca3af">
          <p style="margin:0">Recibiste este correo porque te registraste en ${appName}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  const hook = process.env.MAIL_WEBHOOK_URL;

  console.log('[email] Iniciando envío de verificación a:', to);
  console.log('[email] Variables disponibles:', {
    hasOAuthToken: !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    hasServiceAccount: !!process.env.GOOGLE_CLIENT_EMAIL,
    hasResend: !!apiKey,
    hasWebhook: !!hook,
    publicUrl: process.env.PUBLIC_BASE_URL,
  });

  try {
    // 1) Try Gmail via Service Account (Workspace + Domain-wide delegation)
    const saAttempt = await sendWithGmailServiceAccount({ to, subject, html });
    if (saAttempt.ok) {
      console.log('[email] ✓ Email enviado via Gmail Service Account');
      return { ok: true };
    }
    console.log('[email] ✗ Gmail Service Account falló:', saAttempt);
    
    // 2) Try Gmail via OAuth2 refresh token (personal Gmail or Workspace)
    const gmailAttempt = await sendWithGmail({ to, subject, html });
    if (gmailAttempt.ok) {
      console.log('[email] ✓ Email enviado via Gmail OAuth');
      return { ok: true };
    }
    console.log('[email] ✗ Gmail OAuth falló:', gmailAttempt);

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
        console.log('[email] ✓ Email enviado via Resend');
        return { ok: true };
      } else {
        const msg = r.data?.message || r.data?.error || r.statusText;
        console.warn('[email] ✗ Resend rechazó mensaje:', r.status, msg);
      }
    } else if (hook) {
      const r = await axios.post(hook, { to, subject, html }, { timeout: 10000, validateStatus: () => true });
      if (r.status >= 200 && r.status < 300) {
        console.log('[email] ✓ Email enviado via Webhook');
        return { ok: true };
      }
      console.warn('[email] ✗ Webhook rechazó mensaje:', r.status, r.data?.message || r.statusText);
    }
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    console.error('[email] ✗ Error enviando email:', status, data?.message || String(e));
  }
  console.log(`[email] ⚠️ MODO MOCK - Email a ${to}: ${verifyUrl}`);
  return { ok: true, mocked: true };
}
