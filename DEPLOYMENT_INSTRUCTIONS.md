# 📤 Deployment Instructions

## When Ready to Deploy

Follow these steps to commit and push the bus route feature:

### Step 1: Verify All Changes

```powershell
cd "c:\Users\Creed\OneDrive\Escritorio\COMET 3\Comet"
git status
```

Expected output:
```
 M controllers/busesController.js
 M models/busesModel.js
 M src/components/HotspotsMap.tsx
 M src/pages/Buses.tsx
?? BUSES_ROUTE_FEATURE_TEST.md
?? BUSES_ROUTE_IMPLEMENTATION_SUMMARY.md
?? BUSES_ROUTE_READY_FOR_TESTING.md
?? BUSES_ROUTE_VISUAL_SUMMARY.md
?? src/lib/busColorGenerator.ts
```

### Step 2: Stage All Changes

```powershell
git add -A
```

### Step 3: Create Commit Message

```powershell
git commit -m "Feature: Bus route capture and visualization

- Added routeWaypoints field to bus schema (MongoDB)
- Drivers can now capture route on map during registration
- Routes display as colored polylines on live map
- Each bus gets unique color based on busId hash
- Bus numbers displayed as marker labels (11px)
- 12 distinct colors prevent visual confusion
- Backend validation for waypoint format
- Full backward compatibility with existing buses
- TypeScript types updated for all components
- Complete documentation and testing guide"
```

### Step 4: Push to Repository

```powershell
git push origin main
```

### Step 5: Verify Deployment

1. **Check GitHub**
   - Go to https://github.com/Castillo2308/Comet
   - Verify commit appears on main branch
   - Check commits include all changes

2. **Check Vercel**
   - Go to Vercel dashboard
   - Watch deployment progress
   - Should auto-deploy after push
   - Wait for "Ready" status

3. **Test Production**
   - Visit https://comet-production-url.vercel.app
   - Register new bus with route
   - Verify map shows colored polylines
   - Verify bus numbers display

---

## Rollback (If Needed)

If something goes wrong in production:

```powershell
# Revert to previous commit
git revert HEAD
git push origin main

# OR reset to specific commit
git reset --hard <commit-hash>
git push origin main --force
```

---

## Monitoring

After deployment, monitor:

1. **Vercel Logs**
   - Check for errors in backend
   - Monitor API response times
   - Look for validation errors

2. **Browser Console**
   - Check for JavaScript errors
   - Verify map renders correctly
   - Confirm colors display

3. **Network Tab**
   - Monitor /api/buses/active calls
   - Check payload sizes
   - Ensure waypoints return

---

## Debugging Post-Deployment

### If colors don't display:
```javascript
// In browser console
import { generateBusColor } from './src/lib/busColorGenerator.ts'
generateBusColor('SJO-2024-ABC')
// Should return hex color
```

### If polylines don't show:
```javascript
// Check if routes have waypoints
fetch('/api/buses/active').then(r => r.json()).then(d => {
  console.log('Routes:', d.map(b => ({
    busNumber: b.busNumber,
    waypointCount: b.routeWaypoints?.length
  })))
})
```

### If labels don't show:
- Check browser console for marker errors
- Verify bus numbers are strings
- Check Google Maps API key is valid

---

## Documentation

After deployment, share these files with team:

- `BUSES_ROUTE_VISUAL_SUMMARY.md` - What users will see
- `BUSES_ROUTE_IMPLEMENTATION_SUMMARY.md` - Technical details
- `BUSES_ROUTE_FEATURE_TEST.md` - How to test
- `BUSES_ROUTE_READY_FOR_TESTING.md` - Current status

---

## Success Criteria

After deployment, verify:

✅ Route capture form works
✅ Waypoints save to database
✅ Active buses return waypoints
✅ Colors display on map
✅ Polylines connect waypoints
✅ Bus numbers show on markers
✅ Multiple buses show different colors
✅ No JavaScript errors in console
✅ No API errors in Vercel logs
✅ Backward compatible (old buses work)

---

## Timeline

```
Now:           Feature development complete ✅
When ready:    Review & testing (manual)
Then:          git commit and git push
Vercel:        Auto-deploy (2-3 minutes)
Production:    Live with new feature
Users:         Can see colored routes
```

---

**Remember: Don't commit yet - wait for review!**
