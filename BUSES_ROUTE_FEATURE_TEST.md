# 🚌 Bus Route Feature - Testing Guide

## 📋 Overview

This document describes the new bus route feature implementation that allows:
1. **Drivers** to register a bus with route waypoints (start, intermediate points, end)
2. **Map display** showing colored polylines for each bus route
3. **Bus numbers** displayed as labels above bus markers
4. **Unique colors** for each bus to avoid confusion

---

## 🏗️ Architecture

### Backend Changes

#### `models/busesModel.js`
- Added `routeWaypoints` field: Array of `{lat: number, lng: number}` objects
- Stored in MongoDB alongside existing bus data

#### `controllers/busesController.js`
- `/buses/apply` now validates `routeWaypoints` array
- Each waypoint must have valid `lat` and `lng` numbers
- Logs waypoint count when bus application is created

### Frontend Changes

#### `src/lib/busColorGenerator.ts` (NEW)
- Generates deterministic colors based on `busId`
- 12 vibrant colors available: Red, Turquoise, Sky Blue, Salmon, Mint, Yellow, Purple, Light Blue, Soft Orange, Light Green, Soft Pink, Lavender
- Same bus always gets same color (based on hash of busId)

#### `src/components/HotspotsMap.tsx`
- Extended `HotspotPoint` interface with `busNumber`, `busId`, `routeWaypoints`, `routeColor`
- Renders `<Polyline>` components for each bus route with custom color
- Shows bus number as marker label (11px bold text)

#### `src/pages/Buses.tsx`
- Added `routeWaypoints` to form state
- Added route capture section in registration modal
- Users can click map in `pickMode` to add waypoints
- Shows list of captured waypoints with ability to delete individual points or clear all
- Passes `routeColor` and `routeWaypoints` to `points` array

---

## 🧪 Testing Steps

### 1. **Register a New Bus with Route**

1. Navigate to `/buses` page
2. Click "Unirse como conductor" button
3. Fill in required fields:
   - Número de bus: `101`
   - Placa: `SJO-2024-ABC`
   - Inicio de ruta: `San José`
   - Final de ruta: `Alajuelita`
   - Tarifa: `1500`
   - Licencia: `DL12345678`

4. In "Capturar ruta del bus" section:
   - Click on the map multiple times to create a route path (minimum 2 points recommended)
   - Should see waypoints listed below the map: "Punto 1: 9.9234, -84.1120", etc.
   - Each waypoint shows coordinates (4 decimal places)

5. Click "Enviar solicitud"
   - Should get success confirmation
   - Modal should close
   - Should see application status showing pending approval

---

### 2. **Verify Backend Storage**

**Via API call:**
```bash
# Get pending bus applications (as admin/buses role)
curl -X GET http://localhost:5000/api/buses \
  -H "Authorization: Bearer <token>"
```

**Check response includes:**
```json
{
  "_id": "...",
  "busNumber": "101",
  "busId": "SJO-2024-ABC",
  "routeStart": "San José",
  "routeEnd": "Alajuelita",
  "routeWaypoints": [
    {"lat": 9.9234, "lng": -84.1120},
    {"lat": 9.9250, "lng": -84.1100},
    {"lat": 9.9200, "lng": -84.1050}
  ],
  "status": "pending",
  "...": "..."
}
```

---

### 3. **Approve Bus & View on Map**

**Via admin dashboard or API:**
```bash
# Approve a pending bus (as admin)
curl -X POST http://localhost:5000/api/buses/{busId}/approve \
  -H "Authorization: Bearer <adminToken>"
```

**Expected result:**
- Bus status changes to `approved`
- Driver gets promoted to `driver` role
- User can now start service

---

### 4. **View Route on Live Map**

1. Driver starts service (clicks "Iniciar servicio")
2. System sends initial location to backend via `/buses/driver/start`
3. Go to Buses page and wait for route to load (or refresh page)
4. In map section, should see:
   - **Colored polyline** showing the bus route (connecting all waypoints)
   - Color should be unique to the bus (derived from busId hash)
   - **Bus marker** with number label (e.g., "101")
   - **"En vivo" indicator** showing active buses

---

### 5. **Multiple Buses Test**

Register multiple buses with different busIds to verify:

| Bus Number | Bus ID | Expected Color |
|-----------|--------|----------------|
| 101 | SJO-2024-ABC | Red (#FF6B6B) |
| 102 | SJO-2024-XYZ | Turquoise (#4ECDC4) |
| 103 | SJO-2024-DEF | Sky Blue (#45B7D1) |

- Each bus should display its own colored route
- Each bus should show its number above the marker
- Routes should not overlap confusingly (colors prevent confusion)

---

## 🐛 Testing Edge Cases

### Empty Routes
- Register a bus **without** capturing waypoints
- Should still work (optional field)
- No polyline rendered
- Only marker with number shown

### Single Waypoint
- Capture only 1 point
- Should not render polyline (need minimum 2 points for a line)
- Just marker shown

### Route Deletion
- Click "Limpiar todo" to clear all waypoints
- Should be able to re-capture
- Or submit without waypoints (optional)

### Validation Errors
- Try to submit without valid lat/lng in waypoints
- Backend should return 400 with clear error message
- Frontend should show validation error

---

## 📊 Expected Behavior Checklist

- [ ] Bus registration form includes route capture section
- [ ] Map allows clicking to add waypoints (in registration modal)
- [ ] Waypoints are displayed with coordinates
- [ ] Can delete individual waypoints
- [ ] Can clear all waypoints
- [ ] Backend accepts and stores routeWaypoints array
- [ ] Active buses endpoint returns routeWaypoints
- [ ] Map renders colored polylines for routes with waypoints
- [ ] Bus numbers appear as marker labels
- [ ] Each bus gets unique color based on busId
- [ ] Multiple buses show different colors
- [ ] Routes don't interfere with each other visually

---

## 🔧 Debugging

### Check if polylines render:
```javascript
// In browser console on Buses page
// Should show points with routeWaypoints
console.log('Points:', points);
```

### Check colors:
```javascript
import { generateBusColor } from '../lib/busColorGenerator';
console.log(generateBusColor('SJO-2024-ABC')); // Should output hex color
```

### Check active buses API:
```javascript
// In browser console
fetch('/api/buses/active').then(r => r.json()).then(d => console.log(d));
```

---

## 📝 Notes

- Waypoints are **optional** - existing buses without routes should still work
- Color algorithm is **deterministic** - same busId always gets same color
- Routes are **polylines** - they connect waypoints in order
- Bus numbers use **Google Maps native labels** (limited styling)
- Colors support **48 hours** route visibility (expiration managed by isActive flag)

---

## 🚀 Future Enhancements

1. Route optimization (shortest path calculation)
2. Route history tracking
3. Real-time route updates (driver can modify route while in service)
4. Route sharing (riders can see full route before boarding)
5. Speed visualization (color code based on speed)
6. Estimated time of arrival (ETA) at each waypoint
