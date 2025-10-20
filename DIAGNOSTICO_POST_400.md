# 🔍 Diagnóstico POST /api/users 400

## Qué significa el error

`POST https://comet1-11yzjximo-castillo2308s-projects.vercel.app/api/users 400 (Bad Request)`

El servidor rechaza la solicitud de registro porque algo está mal en los datos.

## Causas más comunes

### 1. **Email inválido** ❌
```
"Test@123" → No tiene punto (.)
"test" → No es email
```
**Solución:** Debe tener formato `usuario@dominio.com`

### 2. **Contraseña no cumple requisitos** ❌
```
Requisitos:
✓ Mínimo 12 caracteres
✓ Una mayúscula
✓ Una minúscula
✓ Un número
✓ Un carácter especial (!@#$%)
✓ Sin espacios
✓ Sin 3+ caracteres repetidos
✓ Sin secuencias (1234, 4321)
```

### 3. **Cédula o Email ya registrados** ❌
```
Error 409 (Conflict), no 400
Pero si no se maneja bien puede ser 400
```

### 4. **Body vacío o mal formado** ❌
```
Headers incorrectos
Content-Type no es application/json
Body truncado
```

## Cómo ver los logs en Vercel

1. Ve a **Vercel Dashboard**
2. Selecciona tu proyecto **comet1**
3. Click en **Logs** o **Function Logs**
4. Filtra por `[register]`
5. Intenta registrarte nuevamente
6. Mira los logs:

```
[register] Request received: { 
  hasName: true, 
  hasLastname: true, 
  hasCedula: true, 
  hasEmail: true, 
  hasPassword: true,
  bodyKeys: ['name', 'lastname', 'cedula', 'email', 'password', 'role']
}
```

Si ves alguno en `false` → Falta ese campo

```
[register] Missing fields: ['email']
```

Si ves esto → El email no se envió

## Pasos para resolver

### Paso 1: Verificar datos antes de enviar
```typescript
console.log('Enviando:', { name, lastname, cedula, email, password });
console.log('Email válido?', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
```

### Paso 2: Revisar logs en Vercel
- ¿Qué fields están llegando?
- ¿Qué validación falla?

### Paso 3: Revisar Response en Network tab
1. Abre DevTools (F12)
2. Ve a **Network**
3. Intenta registrarte
4. Click en la solicitud POST a `/api/users`
5. Ve a **Response** tab
6. Lee el mensaje de error

Ejemplo:
```json
{
  "message": "La contraseña no cumple los requisitos.",
  "violations": [
    "Debe incluir un carácter especial."
  ]
}
```

## Ejemplo de registro válido

```
Nombre: Juan
Apellido: Pérez
Cédula: 12345678901
Email: juan@example.com
Contraseña: Juan2025@Secure
```

✅ Todos los requisitos cumplidos

## Próxima acción

1. Intenta registrarte con datos válidos
2. Si sigue dando 400, revisa los logs en Vercel
3. Comparte el mensaje de error de los logs

¡Eso nos dirá exactamente qué está fallando!
