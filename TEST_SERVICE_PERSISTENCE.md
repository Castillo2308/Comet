# Guía de Prueba - Persistencia del Servicio de Buses

## Preparación

### 1. Limpiar Estado Previo
Antes de probar, abre las DevTools de Chrome (F12) y ejecuta:

```javascript
// Limpiar localStorage
localStorage.clear();

// O solo limpiar estado del servicio
localStorage.removeItem('driverServiceState');
localStorage.removeItem('cedula');
localStorage.removeItem('authUser');
localStorage.removeItem('authToken');
```

**Luego recarga la página (F5)**

### 2. Habilitar Logs en Consola
Los logs ya están en el código. En Chrome DevTools:
```
Presiona F12
Click en "Console"
Busca logs que comiencen con:
  [DriverServiceContext]
  [busesController.*]
  [busesModel.*]
```

---

## Test 1: Botón de Recarga Visible para Usuarios

### Pasos:
1. Login como usuario normal (NO conductor)
2. Ir a página "Buses"
3. Ver sección "Mapa"

### Resultado Esperado:
- ✅ Debe aparecer botón de recarga (🔄) arriba del mapa
- ✅ Botón debe estar disponible para TODOS los usuarios

### Verificación en Código:
```javascript
// Línea en Buses.tsx debe mostrar:
<button
  onClick={fetchActive}
  className="p-1.5 rounded bg-gray-100 text-gray-600..."
  title="Actualizar lista de buses"
>
  <RefreshCw className="h-4 w-4" />
</button>
// SIN condición de {myApp?.status === 'approved' || ...}
```

---

## Test 2: Iniciar Servicio y Cambiar de Página

### Pasos:
1. Login como **conductor aprobado**
2. Ir a "Buses"
3. Verificar que botón dice "Iniciar servicio" (verde)
4. **Habilitar geolocalización** cuando pida permiso
5. Click en "Iniciar servicio"
6. **Esperar 2 segundos** a que se procese
7. Ir a otra página (ej: "Comunidad")
8. **Esperar 5 segundos**
9. Volver a "Buses"
10. Verificar botón

### Resultado Esperado:
- ✅ Botón debe cambiar a "Detener" (rojo) después de hacer click
- ✅ **Botón debe SEGUIR siendo "Detener"** después de cambiar de página
- ✅ **Botón debe SEGUIR siendo "Detener"** después de volver a la página

### Console Logs Esperados:
```
[DriverServiceContext] Checking service status for cedula: XXXXXXXXX
[DriverServiceContext] Service status response: {isRunning: true, hasApplication: true, bus: {...}}
[DriverServiceContext] Service is running, setting isRunning=true
```

### Backend Logs Esperados:
```
[busesController.startService] body: {cedula: 'XXXXXXXXX', lat: 9.934, lng: -84.087}
[busesModel.startServiceByDriver] final result - isActive: true, driverCedula: XXXXXXXXX
[busesController.checkServiceStatus] body: {cedula: 'XXXXXXXXX'}
```

---

## Test 3: Iniciar Servicio y Recargar Página

### Pasos:
1. Login como **conductor aprobado**
2. Ir a "Buses"
3. Click en "Iniciar servicio" (con geolocalización)
4. **Esperar a que cambie a "Detener"**
5. Presionar **F5** para recargar página
6. Esperar a que página cargue completamente
7. Verificar botón

### Resultado Esperado:
- ✅ Después de recargar, botón **DEBE mostrar "Detener"**
- ✅ NO debe mostrar "Iniciar servicio"
- ✅ Servicio debe estar activo en la BD

### Console Logs Esperados:
Después de F5, en la consola debe ver:
```
[DriverServiceContext] Checking service status for cedula: XXXXXXXXX
[DriverServiceContext] Service status response: {isRunning: true, ...}
[DriverServiceContext] Service is running, setting isRunning=true
```

### Base de Datos Esperada:
En MongoDB, el documento del conductor debe tener:
```javascript
{
  driverCedula: "XXXXXXXXX",
  status: "approved",
  isActive: true,  // ✅ CLAVE: Debe ser true
  lat: 9.934,
  lng: -84.087,
  ...
}
```

---

## Test 4: Iniciar, Cerrar Navegador, Reapertura

### Pasos:
1. Login como **conductor aprobado**
2. Ir a "Buses"
3. Click en "Iniciar servicio"
4. **Esperar a que cambie a "Detener"**
5. **Cerrar navegador completamente** (Ctrl+Q o ⌘+Q)
6. Esperar 5 segundos
7. Abrir navegador nuevamente
8. Ir a `http://localhost:5174` (o URL de production)
9. Login con mismas credenciales
10. Ir a "Buses"
11. Verificar botón

### Resultado Esperado:
- ✅ Botón **DEBE mostrar "Detener"**
- ✅ Servicio sigue activo en BD

### Por Qué Funciona:
1. Cuando inicia servicio: `isActive: true` en BD ✅
2. Cuando cierra navegador: BD no se borra
3. Cuando reabre: AuthContext carga usuario
4. DriverServiceContext verifica BD: `isActive: true` ✅
5. Frontend restaura estado

---

## Test 5: Detener Servicio

### Pasos:
1. Asegúrate de que servicio está activo ("Detener" visible)
2. Click en botón "Detener"
3. **Esperar 1 segundo**
4. Verificar que cambia a "Iniciar servicio"
5. Cambiar de página y volver
6. Verificar que sigue siendo "Iniciar servicio"

### Resultado Esperado:
- ✅ Botón cambia a "Iniciar servicio" (verde)
- ✅ **Botón se MANTIENE en "Iniciar servicio"** después de cambiar página
- ✅ En BD: `isActive: false`

### Console Logs Esperados:
```
[DriverServiceContext.stopService] Stopping service for cedula: XXXXXXXXX
[DriverServiceContext.stopService] Backend response status: 200
[DriverServiceContext] Checking service status for cedula: XXXXXXXXX
[DriverServiceContext] Service is not running, cleaning up
```

---

## Test 6: Múltiples Sesiones Simultáneas

### Requisito:
Tener dos navegadores u dos ventanas privadas

### Pasos:
1. **Sesión A (Navegador 1):** Login como conductor
2. **Sesión A:** Ir a "Buses"
3. **Sesión A:** Click "Iniciar servicio"
4. **Sesión A:** Esperar a que diga "Detener"
5. **Sesión B (Navegador 2):** Login como MISMO conductor
6. **Sesión B:** Ir a "Buses"
7. Verificar botón en Sesión B

### Resultado Esperado:
- ✅ **Sesión B debe mostrar "Detener"** 
- ✅ Ambas sesiones leen el mismo `isActive: true` de BD
- ✅ Si Sesión B hace click "Detener", ambas se actualizan

---

## Checklist de Debugging

Si algo no funciona, verifica:

### ❌ Botón de recarga no aparece
- [ ] ¿Estás en la página "Buses"?
- [ ] ¿Viste el commit con el cambio?
- [ ] ¿Limpiaste cache del navegador (Ctrl+Shift+Delete)?
- [ ] ¿Reconstruiste el frontend (npm run build)?

### ❌ "Iniciar servicio" no cambia a "Detener"
- [ ] ¿Permitiste geolocalización?
- [ ] ¿Eres conductor aprobado? (verificar BD o application status)
- [ ] ¿Hay internet/conexión al backend?
- [ ] ¿Mira logs en browser console (F12)?

### ❌ Botón vuelve a "Iniciar" después de cambiar página
- [ ] Verifica logs de `[DriverServiceContext]` en console
- [ ] ¿Dice "Service is not running"?
- [ ] Si sí, significa que `isActive` en BD es `false`
- [ ] Verificar que `startServiceByDriver` se ejecutó correctamente

### ❌ No aparece el mapa
- [ ] ¿GOOGLE_MAPS_KEY está en .env.production?
- [ ] ¿Reconstruiste (npm run build)?
- [ ] ¿Hay buses activos en la BD?

---

## Cómo Leer los Logs

### Browser Console (F12 → Console):

```javascript
// BIEN ✅
[DriverServiceContext] Checking service status for cedula: 1234567890
[DriverServiceContext] Service status response: {isRunning: true, hasApplication: true}
[DriverServiceContext] Service is running, setting isRunning=true

// MAL ❌
[DriverServiceContext] Checking service status for cedula: null
// → Usuario no logueado

[DriverServiceContext] Service status response: {isRunning: false, hasApplication: false}
// → Conductor o no tiene aplicación, o servicio no estaba activo en BD

[DriverServiceContext] Error checking service status: TypeError: Cannot read property 'cedula' of null
// → Problema con Auth
```

### Backend Terminal:

```
// BIEN ✅
[busesModel.startServiceByDriver] final result - isActive: true, driverCedula: 1234567890

// MAL ❌
[busesModel.startServiceByDriver] final result - isActive: undefined, driverCedula: undefined
// → Document no fue encontrado
```

---

## Variables de Entorno a Verificar

Asegúrate de que están en `.env.local` o `.env.production`:

```bash
VITE_GOOGLE_MAPS_KEY=AIzaSyDluFc7caulw2jHJKsPM_mGnLa8oLuFgio
GOOGLE_MAPS_API_KEY=AIzaSyDluFc7caulw2jHJKsPM_mGnLa8oLuFgio
```

---

## Resumen

El flujo de persistencia completo es:

```
Usuario Inicia → BD: isActive=true → Verifica BD → Botón "Detener" ✅
   ↓
Cambio de página → Estado local: isRunning=true → Botón "Detener" ✅
   ↓
Recarga página → Verifica BD: isActive=true → Botón "Detener" ✅
   ↓
Usuario Detiene → BD: isActive=false → Botón "Iniciar" ✅
```

Si algo falla en este flujo, verifica los logs en console y backend para identificar dónde se rompe.
