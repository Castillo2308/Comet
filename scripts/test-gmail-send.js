import { sendVerificationEmail } from '../lib/email.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env.local for local testing
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function main() {
  const to = process.argv[2] || process.env.GMAIL_SENDER_EMAIL || process.env.MAIL_TEST_TO;
  if (!to) {
    console.error('Usage: node scripts/test-gmail-send.js <to-email>  (or set GMAIL_SENDER_EMAIL/MAIL_TEST_TO)');
    process.exit(1);
  }

  // Debug: inspect OAuth token scopes if available
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const sender = process.env.GMAIL_SENDER_EMAIL;
  if (clientId && clientSecret && refreshToken) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });
    try {
      const { token } = await oauth2.getAccessToken();
      if (token) {
        const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);
        if (r.ok) {
          const info = await r.json();
          console.log('[debug] OAuth2 sender:', sender || '(not set)');
          console.log('[debug] Token scopes:', info.scope);
          if (!String(info.scope || '').includes('gmail.send')) {
            console.warn('[debug] Missing gmail.send in token scopes. Re-run: npm run get:gmail-token and update env.');
          }
        } else {
          console.warn('[debug] Could not introspect token:', r.status, r.statusText);
        }
      } else {
        console.warn('[debug] Could not obtain access token from refresh token. Verify GOOGLE_OAUTH_* values and consent.');
      }
    } catch (e) {
      console.warn('[debug] OAuth2 token fetch error:', e?.response?.data || String(e));
    }
  } else {
    console.warn('[debug] Gmail OAuth env not fully set; skipping scope introspection.');
  }
  const url = 'https://example.com/verify?token=test';
  console.log('Sending test email to', to);
  const res = await sendVerificationEmail({ to, verifyUrl: url, appName: 'COMET (Test)' });
  console.log('Result:', res);
}

main().catch((e) => { console.error(e); process.exit(1); });
