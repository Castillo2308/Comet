import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

function getOAuth2ClientFromEnv() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (clientId && clientSecret && refreshToken) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });
    return oauth2;
  }
  return null;
}

function getJwtClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const subject = process.env.GOOGLE_IMPERSONATE_EMAIL || undefined; // optional: domain-wide delegation
  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google service account credentials (GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY)');
  }
  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
    subject,
  });
}

function getAuthClient() {
  // Prefer OAuth2 (My Drive) if configured; otherwise use Service Account (Shared Drive)
  const oauth = getOAuth2ClientFromEnv();
  if (oauth) return oauth;
  return getJwtClient();
}

export async function uploadToDrive(buffer, filename, mimetype, parentFolderId) {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: filename,
    parents: parentFolderId ? [parentFolderId] : undefined,
  };

  const media = {
    mimeType: mimetype,
    body: Buffer.isBuffer(buffer) ? ReadableFromBuffer(buffer) : buffer,
  };

  // Upload
  const createRes = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink, webContentLink',
    supportsAllDrives: true,
  });

  const fileId = createRes.data.id;
  if (!fileId) throw new Error('Drive upload failed: no file id');

  // Make public (anyone with link)
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  });

  // Get links
  const getRes = await drive.files.get({ fileId, fields: 'id, webViewLink, webContentLink', supportsAllDrives: true });
  // For community posts, we standardize to Drive preview URL format
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  return {
    id: fileId,
    webViewLink: getRes.data.webViewLink,
    webContentLink: getRes.data.webContentLink,
    // Standard URL for storage/consumption
    url: previewUrl,
  };
}

// Helper to create a readable stream from buffer without importing stream/promises explicitly
function ReadableFromBuffer(buf) {
  const s = new Readable();
  s.push(buf);
  s.push(null);
  return s;
}

// Extract a Drive file id from common URL formats
export function extractDriveFileId(url) {
  if (!url) return null;
  try {
    const raw = String(url);
    // Match /file/d/<id>/... or /d/<id>/...
    const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m?.[1]) return m[1];
    const u = new URL(raw);
    const id = u.searchParams.get('id');
    if (id) return id;
    // Handle export URLs: https://drive.google.com/uc?export=...
    const ucId = u.searchParams.get('file_id');
    return ucId || null;
  } catch {
    return null;
  }
}

export async function deleteFromDrive(fileId) {
  if (!fileId) return false;
  try {
    const auth = getAuthClient();
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({ fileId, supportsAllDrives: true });
    return true;
  } catch (e) {
    // Log and continue. Common cases: already deleted, access lost.
    console.warn('[drive] delete error:', e?.response?.data || String(e));
    return false;
  }
}
