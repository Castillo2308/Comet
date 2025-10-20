import axios from 'axios';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { google } from 'googleapis';

function getVisionClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const projectId = process.env.GOOGLE_PROJECT_ID;
  if (email && key) {
    return new ImageAnnotatorClient({ credentials: { client_email: email, private_key: key }, projectId });
  }
  return new ImageAnnotatorClient();
}

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

export function extractDriveId(url) {
  try {
    const raw = String(url || '');
    // Support /file/d/{id}/preview and other /d/{id} patterns
    const m1 = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m1?.[1]) return m1[1];
    const u = new URL(raw);
    const id = u.searchParams.get('id');
    return id || null;
  } catch {
    return null;
  }
}

async function fetchImageBytesFromDrive({ fileId }) {
  // try public usercontent first
  const publicUrl = `https://drive.usercontent.google.com/download?id=${fileId}`;
  try {
    const r = await axios.get(publicUrl, { responseType: 'arraybuffer', timeout: 10000 });
    if (r.status >= 200 && r.status < 300) return Buffer.from(r.data);
  } catch {}
  // try uc?export=download fallback
  try {
    const ucUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const r2 = await axios.get(ucUrl, { responseType: 'arraybuffer', timeout: 10000, maxRedirects: 5 });
    if (r2.status >= 200 && r2.status < 300) return Buffer.from(r2.data);
  } catch {}
  // fallback to Drive API via OAuth2
  const oauth = getOAuth2ClientFromEnv();
  if (!oauth) throw new Error('No OAuth token to fetch Drive media');
  const drive = google.drive({ version: 'v3', auth: oauth });
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

// Public-only fetch attempts (no OAuth). Returns Buffer or null
async function fetchImageBytesPublic(fileId) {
  const publicUrl = `https://drive.usercontent.google.com/download?id=${fileId}`;
  try {
    const r = await axios.get(publicUrl, { responseType: 'arraybuffer', timeout: 10000 });
    if (r.status >= 200 && r.status < 300) return Buffer.from(r.data);
  } catch {}
  try {
    const ucUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const r2 = await axios.get(ucUrl, { responseType: 'arraybuffer', timeout: 10000, maxRedirects: 5 });
    if (r2.status >= 200 && r2.status < 300) return Buffer.from(r2.data);
  } catch {}
  return null;
}

// Try Vision by pointing to the Drive preview URL directly
async function tryVisionWithImageUri(client, fileId) {
  const image = { source: { imageUri: `https://drive.google.com/file/d/${fileId}/preview` } };
  try {
    const [safeRes] = await client.safeSearchDetection({ image });
    const [labelsRes] = await client.labelDetection({ image });
    const safe = safeRes?.safeSearchAnnotation || {};
    const labels = labelsRes?.labelAnnotations || [];
    return { ok: true, safe, labels };
  } catch {
    return { ok: false };
  }
}

function likelihoodToScore(l) {
  const map = { VERY_UNLIKELY: 0, UNLIKELY: 1, POSSIBLE: 2, LIKELY: 3, VERY_LIKELY: 4 };
  return map[String(l || '').toUpperCase()] ?? 0;
}

async function perspectiveScore(text) {
  const key = process.env.PERSPECTIVE_API_KEY;
  if (!key || !text || !text.trim()) return { ok: true, scores: {}, max: 0 };
  try {
    const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${key}`;
    const body = {
      comment: { text },
      languages: ['es', 'en'],
      requestedAttributes: {
        TOXICITY: {}, INSULT: {}, THREAT: {}, SEXUAL_EXPLICIT: {}, IDENTITY_ATTACK: {}, PROFANITY: {}
      }
    };
    const r = await axios.post(url, body, { timeout: 8000 });
    const attr = r.data?.attributeScores || {};
    const scores = Object.fromEntries(
      Object.entries(attr).map(([k, v]) => [k, v.summaryScore?.value ?? 0])
    );
    const max = Math.max(0, ...Object.values(scores));
    return { ok: true, scores, max };
  } catch {
    return { ok: false, scores: {}, max: 0 };
  }
}

function normalize(str) {
  try {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s]/g, ' ') // keep alnum
      .replace(/\s+/g, ' ') // collapse spaces
      .trim();
  } catch { return ''; }
}

function tokenize(text) {
  const n = normalize(text);
  const toks = n.split(' ').filter(Boolean);
  const singular = toks.map(t => (t.endsWith('es') ? t.slice(0, -2) : t.endsWith('s') ? t.slice(0, -1) : t));
  return new Set([...toks, ...singular]);
}

function contextMismatch(labels, text) {
  if (!text) return { mismatch: false, matched: [] };
  const terms = tokenize(text);
  const candidates = (labels || []).filter(l => (typeof l.score === 'number' ? l.score >= 0.4 : true));
  const labelTerms = candidates.flatMap(l => String(l.description || '').split(/\s+/)).map(normalize);
  const labelSet = new Set(labelTerms);
 const positivesRaw = [
  'bache', 'pothole', 'hueco', 'agujero', 'crack', 'fisura',
  'agua', 'water', 'inundación', 'flood', 'charco', 'puddle',
  'accidente', 'accident', 'choque', 'collision', 'carro', 'car', 'auto', 'vehículo', 'vehicle',
  'moto', 'motorcycle', 'bike', 'motocicleta',
  'persona', 'person', 'gente', 'people', 'peatón', 'pedestrian',
  'árbol', 'tree', 'rama', 'branch', 'caído', 'fallen',
  'poste', 'pole', 'luz', 'light', 'cable', 'wire',
  'calle', 'street', 'avenida', 'avenue', 'carretera', 'road', 'vía', 'way',
  'escuela', 'school', 'colegio', 'high school', 'universidad', 'university',
  'parque', 'park', 'zona verde', 'green area',
  'basura', 'trash', 'garbage', 'desechos', 'waste',
  'perro', 'dog', 'gato', 'cat', 'animal', 'animal',
  'fuego', 'fire', 'incendio', 'burning', 'smoke', 'humo',
  'balacera', 'shooting', 'arma', 'gun', 'pistola', 'weapon',
  'robo', 'theft', 'asalto', 'robbery', 'vandalismo', 'vandalism',
  'puente', 'bridge', 'paso', 'crosswalk', 'cruce', 'crossing',
  'semáforo', 'traffic light', 'señal', 'sign', 'luz roja', 'red light',
  'tráfico', 'traffic', 'atasco', 'jam', 'embotellamiento', 'congestion',
  'barrio', 'neighborhood', 'comunidad', 'community', 'casa', 'house', 'hogar', 'home',
  'hospital', 'hospital', 'clínica', 'clinic', 'ambulancia', 'ambulance',
  'policía', 'police', 'oficial', 'officer', 'patrulla', 'patrol car',
  'bombero', 'firefighter', 'camión de bomberos', 'fire truck',
  'mercado', 'market', 'tienda', 'store', 'supermercado', 'supermarket',
  'iglesia', 'church', 'templo', 'chapel',
  'niño', 'child', 'kid', 'niña', 'girl', 'adolescente', 'teenager',
  'anciano', 'elderly', 'adulto mayor', 'senior',
  'accidente de tránsito', 'traffic accident',
  'barricada', 'barricade', 'bloqueo', 'blockade', 'manifestación', 'protest',
  'lluvia', 'rain', 'tormenta', 'storm', 'nube', 'cloud',
  'deslizamiento', 'landslide', 'tierra', 'soil', 'barro', 'mud',
  'construcción', 'construction', 'obras', 'works', 'maquinaria', 'machinery',
  'vehículo detenido', 'stopped vehicle', 'car stopped',
  'daño', 'damage', 'rompido', 'broken', 'caído', 'fallen', 'peligro', 'danger', 'riesgo', 'risk'
];
  const positives = new Set(positivesRaw.map(normalize));
  const hits = [];
  for (const t of labelSet) {
    if (terms.has(t) || positives.has(t)) hits.push(t);
  }
  // Only consider mismatch when we actually have some confident labels and none align
  const mismatch = hits.length === 0 && labelTerms.length > 0;
  return { mismatch, matched: hits.slice(0, 5) };
}

function containsSpanishInsults(text) {
  const t = normalize(text);
  if (!t) return false;
  // Regex patterns with word boundaries and simple stemming
 const patterns = [
  /\bputa(s)?\b/,
  /\bputo(s)?\b/,
  /\bmierda(s)?\b/,
  /\bimbecil(es)?\b/,
  /\bidiota(s)?\b/,
  /\bpendej(o|a|os|as)\b/,
  /\bcabron(e|es)?\b/,
  /\bestupid(o|a|os|as)\b/,
  /\bmaldit(o|a|os|as)\b/,
  /\bperr(o|a|os|as)\b/,
  /\bhijue?puta(s)?\b/,
  /\bgilipolla(s)?\b/,
  /\bmaric(a|on|ones|as)\b/,
  /\bculer(o|a|os|as)\b/,
  /\bhpta\b/,
  /\bhp\b/,
  /\bcoñ(o|a|os|as)\b/,
  /\bcag(ón|ona|ones|onas)?\b/,
  /\bverg(a|as|ón|ones)?\b/,
  /\bpich(a|as|ón|ones)?\b/,
  /\bchimba(s)?\b/,
  /\bchupame\b/,
  /\bchupala\b/,
  /\bchinga(r|do|da|das|dos)?\b/,
  /\bchingad(o|a|os|as)\b/,
  /\bjod(er|ido|ida|idos|idas)?\b/,
  /\bcaraj(o|a|os|as)\b/,
  /\bcojon(es)?\b/,
  /\bcul(o|os|a|as)\b/,
  /\bnalg(a|as)\b/,
  /\bmalparid(o|a|os|as)\b/,
  /\bcare(monda|culo|verga|chimba)\b/,
  /\bgonorr(ea|iento|ienta|ientos|ientas)?\b/,
  /\bzorr(a|as)\b/,
  /\bputaz(o|os)\b/,
  /\bhdp\b/,
  /\bfuck(ing)?\b/,
  /\bbitch(es)?\b/,
  /\bass(hole|es)?\b/,
  /\bshit\b/,
  /\bdamn\b/,
  /\bdumb(ass|fuck)?\b/,
  /\bmoron(s)?\b/,
  /\bstupid\b/,
  /\bfag(got|s)?\b/,
  /\bwhore(s)?\b/,
  /\bslut(s)?\b/,
  /\bcock(s|er|sucker)?\b/,
  /\bballs?\b/,
  /\bboob(s)?\b/,
  /\btitties\b/,
  /\bnippl(e|es)\b/,
  /\bdick(s)?\b/,
  /\bpen(is|e|es)\b/,
  /\bvagin(a|as)\b/,
  /\btet(a|as)\b/,
  /\bsen(o|os)\b/,
  /\borgasm(o|os)?\b/,
  /\borg(ia|ías)\b/,
  /\bsexo\b/,
  /\btesticul(o|os)\b/,
  /\bhuev(o|os)\b/,
  /\bpich(a|as)\b/,
  /\bpanoch(a|as)\b/,
  /\bmic(o|os|a|as)\b/,
  /\bping(a|as)\b/,
  /\bpoll(a|as)\b/,
  /\bpack(s)?\b/,
  /\bfoll(ar|ando|ado|ada|adas|ados)?\b/,
  /\bculi(ar|ando|ado|ada|adas|ados)?\b/,
  /\blig(ar|ando|ado|ada|adas|ados)?\b/,
  /\bverg(a|as)\b/
];
  return patterns.some(rx => rx.test(t));
}

function labelTextAlignment(labels, text) {
  const terms = tokenize(text);
  const candidates = (labels || []).filter(l => typeof l.score === 'number' && l.score >= 0.4);
  if (!candidates.length) return 0;
const positivesRaw = [
  'bache', 'pothole', 'hueco', 'agujero', 'crack', 'fisura',
  'agua', 'water', 'inundación', 'flood', 'charco', 'puddle',
  'accidente', 'accident', 'choque', 'collision', 'carro', 'car', 'auto', 'vehículo', 'vehicle',
  'moto', 'motorcycle', 'bike', 'motocicleta',
  'persona', 'person', 'gente', 'people', 'peatón', 'pedestrian',
  'árbol', 'tree', 'rama', 'branch', 'caído', 'fallen',
  'poste', 'pole', 'luz', 'light', 'cable', 'wire',
  'calle', 'street', 'avenida', 'avenue', 'carretera', 'road', 'vía', 'way',
  'escuela', 'school', 'colegio', 'high school', 'universidad', 'university',
  'parque', 'park', 'zona verde', 'green area',
  'basura', 'trash', 'garbage', 'desechos', 'waste',
  'perro', 'dog', 'gato', 'cat', 'animal', 'animal',
  'fuego', 'fire', 'incendio', 'burning', 'smoke', 'humo',
  'balacera', 'shooting', 'arma', 'gun', 'pistola', 'weapon',
  'robo', 'theft', 'asalto', 'robbery', 'vandalismo', 'vandalism',
  'puente', 'bridge', 'paso', 'crosswalk', 'cruce', 'crossing',
  'semáforo', 'traffic light', 'señal', 'sign', 'luz roja', 'red light',
  'tráfico', 'traffic', 'atasco', 'jam', 'embotellamiento', 'congestion',
  'barrio', 'neighborhood', 'comunidad', 'community', 'casa', 'house', 'hogar', 'home',
  'hospital', 'hospital', 'clínica', 'clinic', 'ambulancia', 'ambulance',
  'policía', 'police', 'oficial', 'officer', 'patrulla', 'patrol car',
  'bombero', 'firefighter', 'camión de bomberos', 'fire truck',
  'mercado', 'market', 'tienda', 'store', 'supermercado', 'supermarket',
  'iglesia', 'church', 'templo', 'chapel',
  'niño', 'child', 'kid', 'niña', 'girl', 'adolescente', 'teenager',
  'anciano', 'elderly', 'adulto mayor', 'senior',
  'accidente de tránsito', 'traffic accident',
  'barricada', 'barricade', 'bloqueo', 'blockade', 'manifestación', 'protest',
  'lluvia', 'rain', 'tormenta', 'storm', 'nube', 'cloud',
  'deslizamiento', 'landslide', 'tierra', 'soil', 'barro', 'mud',
  'construcción', 'construction', 'obras', 'works', 'maquinaria', 'machinery',
  'vehículo detenido', 'stopped vehicle', 'car stopped',
  'daño', 'damage', 'rompido', 'broken', 'caído', 'fallen', 'peligro', 'danger', 'riesgo', 'risk'
];
  const positives = new Set(positivesRaw.map(normalize));
  let aligned = 0;
  let total = 0;
  for (const l of candidates) {
    total += l.score || 0;
    const parts = String(l.description || '').split(/\s+/).map(normalize);
    const hit = parts.some(p => terms.has(p) || positives.has(p));
    if (hit) aligned += l.score || 0;
  }
  if (total === 0) return 0;
  return Math.max(0, Math.min(1, aligned / total));
}

export async function analyzeImageForModeration({ photo_link, text }) {
  const client = getVisionClient();
  const id = extractDriveId(photo_link || '');
  let buffer = null;
  let safe = {};
  let labels = [];
  // 1) Try public direct downloads (usercontent / uc)
  if (id) {
    try { buffer = await fetchImageBytesPublic(id); } catch {}
    if (buffer) {
      const [safeRes] = await client.safeSearchDetection({ image: { content: buffer } });
      const [labelsRes] = await client.labelDetection({ image: { content: buffer } });
      safe = safeRes?.safeSearchAnnotation || {};
      labels = labelsRes?.labelAnnotations || [];
    } else {
      // 2) Try Vision on the preview URL
      const viaUri = await tryVisionWithImageUri(client, id);
      if (viaUri.ok) {
        safe = viaUri.safe || {};
        labels = viaUri.labels || [];
      } else {
        // 3) Fallback to OAuth download
        try {
          buffer = await fetchImageBytesFromDrive({ fileId: id });
          const [safeRes] = await client.safeSearchDetection({ image: { content: buffer } });
          const [labelsRes] = await client.labelDetection({ image: { content: buffer } });
          safe = safeRes?.safeSearchAnnotation || {};
          labels = labelsRes?.labelAnnotations || [];
        } catch {
          // If we cannot access the image, proceed with text-only moderation
          safe = {};
          labels = [];
        }
      }
    }
  }
  const tox = await perspectiveScore(text || '');

  const adultS = likelihoodToScore(safe.adult);
  const violenceS = likelihoodToScore(safe.violence);
  const racyS = likelihoodToScore(safe.racy);
  const medicalS = likelihoodToScore(safe.medical);
  const spoofS = likelihoodToScore(safe.spoof);

  const imageUnsafe = adultS >= 3 || violenceS >= 3 || racyS >= 3;
  const toxScores = tox.scores || {};
  const textToxic = containsSpanishInsults(text || '') ||
    (toxScores.TOXICITY ?? 0) >= 0.65 ||
    (toxScores.INSULT ?? 0) >= 0.6 ||
    (toxScores.PROFANITY ?? 0) >= 0.6 ||
    (toxScores.THREAT ?? 0) >= 0.5 ||
    tox.max >= 0.7;
  const mm = contextMismatch(labels || [], text || '');
  const align = labelTextAlignment(labels || [], text || '');
  // SafeSearch context: if image is very safe, be more lenient on mismatch threshold
  const safeOk = (adultS <= 1) && (violenceS <= 1) && (racyS <= 1);
  const mismatchByAlign = (align < (safeOk ? 0.15 : 0.2)) && (labels || []).some(l => (l.score || 0) >= 0.4);
  const ai_mismatch_final = !!(mm.mismatch && mismatchByAlign);

  const ai_flagged = imageUnsafe || textToxic;
  const autoApprove = !ai_flagged && !ai_mismatch_final;
  const topLabels = (labels || []).slice(0,5).map(l => l.description).join(', ');
  const keyTox = ['TOXICITY','INSULT','PROFANITY','THREAT'].map(k => `${k}:${(toxScores[k]??0).toFixed(2)}`).join(' ');
  // Build human summary with special phrasing when image is safe but context mismatches
  const parts = [];
  if (ai_mismatch_final && safeOk) {
    parts.push('Imagen segura pero no coincide.');
  } else {
    parts.push(imageUnsafe ? 'Imagen riesgosa (SafeSearch).' : 'Imagen segura.');
    parts.push(ai_mismatch_final ? 'Posible imagen fuera de contexto.' : 'Imagen acorde al contexto.');
  }
  parts.push(textToxic ? `Texto tóxico. (${keyTox})` : `Texto no tóxico. (${keyTox})`);
  if (topLabels) parts.push(`Etiquetas: ${topLabels}.`);
  const summary = parts.join(' ');

  return {
    ai_flagged,
    ai_summary: summary,
    ai_scores: {
      safeSearch: { adult: adultS, violence: violenceS, racy: racyS, medical: medicalS, spoof: spoofS },
      perspective: tox.scores || {},
      perspective_max: tox.max || 0
    },
    ai_labels: (labels || []).slice(0, 10).map(l => ({ desc: l.description, score: l.score })),
    ai_safe: safe,
    ai_mismatch: ai_mismatch_final,
    ai_text_toxic: !!textToxic,
    autoApprove,
    checked_at: new Date().toISOString(),
  };
}
