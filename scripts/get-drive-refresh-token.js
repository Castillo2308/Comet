import http from 'http';
import readline from 'readline';
import { google } from 'googleapis';

const PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  let clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  let clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';

  if (!clientId) clientId = await prompt('Enter GOOGLE_OAUTH_CLIENT_ID: ');
  if (!clientSecret) clientSecret = await prompt('Enter GOOGLE_OAUTH_CLIENT_SECRET: ');

  const oauth2Client = new google.auth.OAuth2(clientId.trim(), clientSecret.trim(), REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('\n1) Open this URL in your browser and authorize access:');
  console.log(authUrl);
  console.log(`\n2) After consenting, Google will redirect to ${REDIRECT_URI}. This script is listening to capture the code...`);

  const code = await new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      if (!req.url) return;
      const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
      if (url.pathname === '/oauth2callback') {
        const codeParam = url.searchParams.get('code');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h3>Authorization received. You can close this tab.</h3>');
        server.close();
        resolve(codeParam || '');
      } else {
        res.writeHead(404); res.end();
      }
    });
    server.listen(PORT, '127.0.0.1');
  });

  if (!code) {
    console.error('No code received. Ensure you completed consent in the browser.');
    process.exit(1);
  }

  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    console.error('No refresh_token returned. Ensure you set prompt=consent and access_type=offline, or remove previous consent for this app and retry.');
    console.log('Tokens:', tokens);
    process.exit(1);
  }

  console.log('\nSuccess! Add these to your .env:');
  console.log(`GOOGLE_OAUTH_CLIENT_ID=${clientId}`);
  console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${clientSecret}`);
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
