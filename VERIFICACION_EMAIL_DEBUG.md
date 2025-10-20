# 🔍 Verificación de Email - Debug y Solución de Problemas

## Flujo Actual

```
1. Usuario se registra → POST /api/users
2. Se genera token de verificación (crypto.randomBytes(24))
3. Se inserta en tabla verification_tokens
4. Se envía email con link de verificación
5. Usuario hace click → GET /api/users/verify?token=XXX
6. Se verifica token y se marca usuario como verified=true
```

## ❌ Puntos de Fallo Identificados

### 1. **Email Service falla silenciosamente**
```javascript
// En controllers/usersController.js - línea 90
try { await sendVerificationEmail({ to: email, verifyUrl }); } catch {}
// ☝️ El error se ignora completamente con catch {}
```
**Síntoma:** El usuario se registra pero nunca recibe el email.
**Causa:** Falta una o más variables de entorno en Vercel.

### 2. **Variables de Entorno Faltantes**
El email.js intenta en este orden:
1. Gmail Service Account (requiere: `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_OAUTH_REFRESH_TOKEN`)
2. Gmail OAuth (requiere: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`)
3. Resend API (requiere: `RESEND_API_KEY`)
4. Webhook personalizado (requiere: `MAIL_WEBHOOK_URL`)

**Si ninguna está configurada:** El email NO se envía.

### 3. **GMAIL_SENDER_EMAIL no está siendo usado correctamente**
```javascript
// En email.js - getGmailJwtClient()
const subject = process.env.GOOGLE_IMPERSONATE_EMAIL || process.env.GMAIL_SENDER_EMAIL || '';
// ☝️ Si GMAIL_SENDER_EMAIL es un @gmail.com, el Service Account NO funcionará
// porque los SA no pueden suplantar cuentas de consumidor
```

**Síntoma:** El método `sendWithGmailServiceAccount` retorna `{ ok: false, reason: 'no-gmail-jwt' }`

### 4. **PUBLIC_BASE_URL no está configurada**
```javascript
// En controllers/usersController.js - línea 88
const baseUrl = process.env.PUBLIC_BASE_URL || (req.headers.origin || `${req.protocol}://${req.get('host')}`);
// ☝️ En Vercel, req.protocol puede ser 'http' en lugar de 'https'
```

**Síntoma:** El link de verificación en el email apunta a `http://...` en lugar de `https://...`

### 5. **Token NO se está guardando en BD**
```javascript
// En models/usersModel.js
export const insertVerifyToken = async ({ token, email, expiresAt }) => {
  await neonClient`
    insert into verification_tokens (token, email, expires_at) values (${token}, ${email}, ${expiresAt})
  `;
  return true;
};
```

**Síntoma:** La tabla `verification_tokens` no existe o no tiene permisos.

---

## ✅ Solución Paso a Paso

### PASO 1: Verificar en Vercel que TODAS estas variables están configuradas:
```
GMAIL_SENDER_EMAIL=expo.comet@gmail.com
GOOGLE_OAUTH_CLIENT_ID=340473883373-...
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...
GOOGLE_OAUTH_REFRESH_TOKEN=1//01GjqBN8...
GOOGLE_PROJECT_ID=civic-summer-474922-m9
GOOGLE_CLIENT_EMAIL=visionapi@civic-summer-474922-m9.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
PUBLIC_BASE_URL=https://comet1.vercel.app
```

### PASO 2: Verificar que la tabla existe
Ejecutar en tu BD Neon:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'verification_tokens';
```

Si NO existe, ejecutar:
```sql
CREATE TABLE IF NOT EXISTS verification_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(100) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### PASO 3: Agregar logging para debug
Modificar `lib/email.js` para loguear por qué falla:

```javascript
// Reemplazar línea ~141 en email.js
export async function sendVerificationEmail({ to, verifyUrl, appName = 'COMET' }) {
  // ... código existente ...
  
  try {
    console.log('[email-debug] Intentando enviar verificación a:', to);
    console.log('[email-debug] PUBLIC_BASE_URL:', process.env.PUBLIC_BASE_URL);
    console.log('[email-debug] GOOGLE_OAUTH_REFRESH_TOKEN existe:', !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN);
    console.log('[email-debug] GOOGLE_CLIENT_EMAIL existe:', !!process.env.GOOGLE_CLIENT_EMAIL);
    
    // 1) Try Gmail via Service Account
    const saAttempt = await sendWithGmailServiceAccount({ to, subject, html });
    console.log('[email-debug] SA attempt result:', saAttempt);
    if (saAttempt.ok) return { ok: true };
    
    // 2) Try Gmail via OAuth2 refresh token
    const gmailAttempt = await sendWithGmail({ to, subject, html });
    console.log('[email-debug] Gmail OAuth attempt result:', gmailAttempt);
    if (gmailAttempt.ok) return { ok: true };
    
    // ... resto del código ...
  } catch (e) {
    console.error('[email-debug] Email service error:', e);
  }
}
```

### PASO 4: Modificar controlador para loguear errores
```javascript
// En controllers/usersController.js, línea 90 - CAMBIAR ESTO:
try { await sendVerificationEmail({ to: email, verifyUrl }); } catch {}

// POR ESTO:
try { 
  const emailResult = await sendVerificationEmail({ to: email, verifyUrl }); 
  console.log('[register] Email enviado a', email, ':', emailResult);
} catch (err) {
  console.error('[register] Error enviando email:', err);
}
```

---

## 🧪 Test Local

Para probar que todo funciona en local:

```bash
npm run dev
```

Registrate y verifica en consola:
1. ¿Se ve `[register] Email enviado a...`?
2. ¿Ves el token en la consola?
3. ¿Llega el email?

---

## 📋 Checklist de Verificación

- [ ] ¿Todas las variables de entorno están en Vercel?
- [ ] ¿La tabla `verification_tokens` existe en BD?
- [ ] ¿El email se envía localmente?
- [ ] ¿El link del email tiene `https://` en lugar de `http://`?
- [ ] ¿Se ve `[verify] Send email...` en logs = email mock (fallback), no es error
- [ ] ¿Se ve error real = hace falta variable de entorno

---

## 🚀 Alternativa: Usar Resend en lugar de Gmail

Si quieres simplificar, puedes usar Resend (email SaaS):

1. Registrate en https://resend.com
2. Copia tu API Key
3. Agrega en Vercel: `RESEND_API_KEY=re_xxxxx`
4. Listo, el código ya lo soporta

