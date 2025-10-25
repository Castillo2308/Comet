# Flujo de Persistencia del Servicio de Buses

## Resumen
El servicio de buses ahora se persiste completamente en la base de datos MongoDB. Una vez que un conductor inicia el servicio, permanece activo en la BD incluso si cierra la aplicación, cambia de página, o recarga el navegador.

## Arquitectura

### 1. Frontend - DriverServiceContext.tsx
**Responsabilidades:**
- Mantener estado local (`isRunning`) del servicio
- Sincronizar estado con localStorage como backup
- Inicializar estado verificando BD al cargar la app
- Llamar endpoints para iniciar/detener servicio

**Estado:**
```typescript
interface DriverServiceState {
  isRunning: boolean;           // Estado local del servicio
  lastLocation: { lat, lng };   // Última ubicación enviada
  startTime: number;             // Timestamp de inicio
  cedula: string;               // Cédula del conductor
}
```

### 2. Backend - Controlador (busesController.js)

**Endpoints:**
- `POST /buses/driver/start` - Inicia el servicio
- `POST /buses/driver/stop` - Detiene el servicio
- `POST /buses/driver/status` - Verifica estado del servicio
- `POST /buses/driver/ping` - Envía actualización de ubicación

**Flujo:**
```javascript
POST /buses/driver/start
  ↓
startService controller
  ↓
startServiceByDriver model (actualiza BD con isActive: true)
  ↓
Retorna bus documento con isActive: true
```

### 3. Backend - Modelo (busesModel.js)

**Colección buses en MongoDB:**
```javascript
{
  _id: ObjectId,
  driverCedula: String,      // Identificador del conductor
  status: 'approved',         // Estado de aprobación (pending/approved/rejected)
  isActive: Boolean,          // ✅ CLAVE: Indica si el servicio está activo
  stage: String,              // 'pickup' o 'route'
  lat: Number,                // Ubicación actual
  lng: Number,                // Ubicación actual
  lastLocationUpdate: Date,   // Última actualización de ubicación
  updatedAt: Date,            // Timestamp de última actualización
  busNumber: String,
  busId: String,
  routeStart: String,
  routeEnd: String,
  routeWaypoints: Array,
  displayRoute: Array,
  ...otros campos
}
```

## Flujo de Inicio de Servicio

### 1️⃣ Usuario hace clic en "Iniciar Servicio"
```
Buses.tsx → handleStartService()
```

### 2️⃣ DriverServiceContext.startService()
```typescript
1. Resolver cédula del conductor
2. Solicitar geolocalización actual
3. POST /buses/driver/start {cedula, lat, lng}
4. Backend actualiza isActive: true en BD ✅
5. setIsRunning(true) en frontend
6. Guardar estado en localStorage
7. Iniciar seguimiento de ubicación
```

### 3️⃣ Backend actualiza BD
```javascript
startServiceByDriver(cedula, lat, lng)
  ↓
findOneAndUpdate({driverCedula, status: 'approved'}, {$set: {isActive: true}})
  ↓
Retorna documento actualizado con isActive: true
```

### 4️⃣ Frontend recibe respuesta
- Estado local: `isRunning = true`
- localStorage: `{isRunning: true, cedula, ...}`
- BD: `isActive: true`
- UI: Botón cambia de "Iniciar" a "Detener"

## Persistencia Durante Navegación

### Escenario: Usuario inicia servicio y navega a otra página

```
1. Servicio inicia (isActive: true en BD) ✅
2. Usuario navega a "Comunidad"
   ↓
   DriverServiceContext sigue manteniendo isRunning=true
   localStorage tiene {isRunning: true}
   Botón sigue mostrando "Detener" ✅
   
3. Usuario regresa a "Buses"
   ↓
   useEffect en DriverServiceContext corre
   Verifica BD via checkServiceStatus()
   BD dice: isActive: true ✅
   setState(isRunning: true) ✅
   Botón muestra "Detener" ✅
```

## Persistencia Durante Recarga

### Escenario: Usuario inicia servicio, recarga la página

```
1. Servicio inicia (isActive: true en BD) ✅
2. Usuario presiona F5 / recarga página
   ↓
   App se reinicia
   AuthContext carga usuario desde localStorage
   DriverServiceContext inicializa
   
3. useEffect en DriverServiceContext dispara
   if (user?.cedula) → checkServiceStatus(cedula)
   
4. Backend verifica BD
   getDriverServiceStatus(cedula)
   SELECT * FROM buses WHERE driverCedula=? AND status='approved'
   Encuentra documento con isActive: true ✅
   
5. Frontend recibe respuesta
   data.isRunning = true (mapeado de isActive)
   setIsRunning(true)
   Botón muestra "Detener" ✅
```

## Flujo de Detención

### Usuario hace clic en "Detener"

```
1. Buses.tsx → handleStopService()
2. DriverServiceContext.stopService()
3. POST /buses/driver/stop {cedula}
4. Backend: findOneAndUpdate({...}, {$set: {isActive: false}}) ✅
5. Frontend: cleanup() → setIsRunning(false)
6. localStorage se limpia
7. UI: Botón vuelve a "Iniciar Servicio"
```

## Verificación de Persistencia

### Logs para debugging:

**Frontend (Chrome DevTools → Console):**
```
[DriverServiceContext] Checking service status for cedula: 1234567890
[DriverServiceContext] Service status response: {isRunning: true, hasApplication: true}
[DriverServiceContext] Service is running, setting isRunning=true
```

**Backend (Terminal):**
```
[busesController.startService] body: {cedula: '1234567890', lat: 9.934, lng: -84.087}
[busesModel.startServiceByDriver] final result - isActive: true, driverCedula: 1234567890

[busesController.checkServiceStatus] body: {cedula: '1234567890'}
[busesModel.getDriverServiceStatus] bus found: isActive=true
```

## Casos de Prueba

### ✅ Test 1: Iniciar y cambiar de página
1. Login como conductor
2. Ir a "Buses"
3. Click "Iniciar Servicio"
4. Ir a "Comunidad"
5. Volver a "Buses"
6. **Esperado:** Botón muestra "Detener"

### ✅ Test 2: Iniciar y recargar página
1. Login como conductor
2. Ir a "Buses"
3. Click "Iniciar Servicio"
4. F5 (recargar)
5. **Esperado:** Botón muestra "Detener"

### ✅ Test 3: Iniciar y cerrar/abrir navegador
1. Login como conductor
2. Ir a "Buses"
3. Click "Iniciar Servicio"
4. Cerrar navegador completamente
5. Abrir nueva pestaña y login nuevamente
6. Ir a "Buses"
7. **Esperado:** Botón muestra "Detener"

### ✅ Test 4: Iniciar, cerrar y detener desde otra sesión
1. Sesión A: Login, Buses, Iniciar Servicio
2. Sesión B: Login (mismo usuario), Buses
3. **Esperado:** Botón muestra "Detener" en Sesión B
4. Click Detener en Sesión B
5. **Esperado:** Sesión A y B muestran "Iniciar Servicio"

## Base de Datos

### Estructura del documento en MongoDB:

```javascript
db.buses.findOne({driverCedula: "1234567890"})

{
  "_id": ObjectId("..."),
  "driverCedula": "1234567890",
  "status": "approved",
  "isActive": true,              // ✅ Indica servicio activo
  "stage": "pickup",
  "lat": 9.934,
  "lng": -84.087,
  "lastLocationUpdate": ISODate("2025-10-23T..."),
  "busNumber": "100",
  "busId": "TEC-2023-001",
  "routeStart": "San José",
  "routeEnd": "Cartago",
  "routeWaypoints": [...],
  "displayRoute": [...],
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("2025-10-23T...")
}
```

### Consultas clave:

```javascript
// Iniciar servicio
db.buses.findOneAndUpdate(
  {driverCedula: "1234567890", status: "approved"},
  {$set: {isActive: true, lat: 9.934, lng: -84.087, updatedAt: new Date()}},
  {returnDocument: 'after'}
)

// Verificar estado
db.buses.findOne({driverCedula: "1234567890", status: "approved"})
// Si documento existe y isActive: true → servicio activo

// Detener servicio
db.buses.findOneAndUpdate(
  {driverCedula: "1234567890", status: "approved", isActive: true},
  {$set: {isActive: false, updatedAt: new Date()}},
  {returnDocument: 'after'}
)

// Listar buses activos para usuario
db.buses.find({status: "approved", isActive: true})
```

## Notas Importantes

1. **`isActive` es la fuente de verdad en BD**
   - Frontend sincroniza este valor
   - Cada recarga verifica BD

2. **Geolocalización es permanente mientras isActive: true**
   - Conductor puede cerrar app y servicio sigue activo
   - Las ubicaciones se almacenan en BD

3. **localStorage es solo backup**
   - Si se borra localStorage, BD tiene la verdad
   - Si se borra BD accidentalmente, localStorage restaura

4. **Endpoint `/buses/driver/status` es crítico**
   - Se ejecuta al cargar la app
   - Sincroniza estado frontend con BD
   - Permite cambios desde múltiples sesiones

5. **El campo `driverCedula` debe ser String**
   - Asegura consultas correctas en BD
   - Evita problemas de tipo

## Troubleshooting

### Problema: Botón sigue mostrando "Iniciar" después de hacer click
**Causas posibles:**
1. `getDriverServiceStatus` no está siendo llamado
2. BD no se está actualizando (isActive sigue siendo false)
3. Error de permiso de geolocalización

**Solución:**
- Verificar logs de browser y backend
- Confirmar que permiso de geolocalización está concedido
- Verificar que aplicación de bus tiene status: 'approved'

### Problema: Estado se pierde al cambiar de página
**Solución:**
- DriverServiceContext ahora sincroniza con BD automáticamente
- No debería ocurrir con cambios recientes

### Problema: Botón muestra "Detener" pero no se ve ubicación
**Causas posibles:**
1. Servicio inició pero no se envió ubicación (ping)
2. BD tiene isActive: true pero lat/lng son null

**Solución:**
- El endpoint `/buses/driver/ping` envía ubicaciones
- Revisar que startLocationTracking() está activo
