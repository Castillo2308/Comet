import { createBusApplication, listBuses, listActiveBuses, getBusById, updateBus, deleteBus, startServiceByDriver, stopServiceByDriver, updateLocationByDriver, approveBus, rejectBus, findApplicationForUser } from '../models/busesModel.js';
import { updateUserRole } from '../models/usersModel.js';
import { isPrivileged } from '../lib/auth.js';
import { ObjectId } from '../lib/mongoClient.js';
import { calculateRoute, isDriverOffRoute, hasArrivedAtStart, calculateDistance, isFarFromStart } from '../lib/routeCalculator.js';

export default {
  // Public: list active buses for user map
  async listActive(_req, res) {
    try { 
      const buses = await listActiveBuses();
      // Ensure all buses have displayRoute or fallback to routeWaypoints
      const busesWithRoutes = buses.map(bus => ({
        ...bus,
        displayRoute: bus.displayRoute || bus.routeWaypoints || []
      }));
      console.log('[listActive] Returning buses with routeColor:', busesWithRoutes.map(b => ({ busId: b.busId, routeColor: b.routeColor })));
      res.json(busesWithRoutes);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list active buses' }); }
  },
  // Admin: list all buses
  async listAll(req, res) {
    try {
      const role = req.user?.role;
      if (!(isPrivileged(role) || role === 'buses')) return res.status(403).json({ message: 'Prohibido' });
      res.json(await listBuses());
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list buses' }); }
  },
  // User: get my application
  async mine(req, res) {
    try {
      const { cedula } = req.body || {};
      if (!cedula) return res.status(401).json({ message: 'Unauthorized' });
      const app = await findApplicationForUser(cedula);
      res.json(app || null);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to get application' }); }
  },
  // User: apply to be driver
  async apply(req, res) {
    try {
      const { cedula, ...body } = req.body || {};
      if (!cedula) return res.status(401).json({ message: 'Unauthorized' });
      
      // Validate required fields
      if (!body.routeStart || !body.routeEnd) {
        return res.status(400).json({ message: 'routeStart y routeEnd son requeridos' });
      }

      // Calculate route automatically using Google Directions API
      console.log('[apply] Calculating route from:', body.routeStart, 'to:', body.routeEnd);
      const calculatedWaypoints = await calculateRoute(body.routeStart, body.routeEnd);
      
      if (calculatedWaypoints.length === 0) {
        console.warn('[apply] No route calculated, proceeding without waypoints');
        // Don't fail - just proceed without waypoints
      }

      // Merge calculated waypoints with application data
      const appData = {
        ...body,
        driverCedula: cedula,
        routeWaypoints: calculatedWaypoints, // Set calculated waypoints
      };

      const created = await createBusApplication(appData);
      console.log('[apply] Bus application created:', { 
        busNumber: created.busNumber, 
        busId: created.busId, 
        waypointCount: created.routeWaypoints?.length || 0,
        routeStart: created.routeStart,
        routeEnd: created.routeEnd,
      });
      res.status(201).json(created);
    } catch (e) { 
      console.error('[apply] Error:', e);
      const msg = e.message || 'Failed to submit application';
      res.status(400).json({ message: msg });
    }
  },
  // Admin approve: promote user to driver and approve bus application
  async approve(req, res) {
    try {
      const role = req.user?.role;
      if (!(isPrivileged(role) || role === 'buses')) return res.status(403).json({ message: 'Prohibido' });
      const busId = req.params.id;
      const bus = await getBusById(busId);
      if (!bus) return res.status(404).json({ message: 'Bus application not found' });
      if (bus.status !== 'pending') return res.status(400).json({ message: 'Application is not pending' });
      
      // Approve the bus application
      const updated = await approveBus(busId);
      if (!updated) return res.status(500).json({ message: 'Failed to approve application' });
      
      // Promote user to driver role
      console.log(`Promoting user ${bus.driverCedula} to driver role...`);
      const userUpdated = await updateUserRole(bus.driverCedula, 'driver');
      if (!userUpdated) {
        console.error(`ERROR: Failed to update user role for ${bus.driverCedula}`);
      } else {
        console.log(`SUCCESS: User ${bus.driverCedula} promoted to driver. New role: ${userUpdated.role}`);
      }
      
      res.json({ message: 'Approved', bus: updated, userPromoted: !!userUpdated });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to approve bus' }); }
  },
  async reject(req, res) {
    try {
      const role = req.user?.role;
      if (!(isPrivileged(role) || role === 'buses')) return res.status(403).json({ message: 'Prohibido' });
      const busId = req.params.id;
      const updated = await rejectBus(busId);
      if (!updated) return res.status(404).json({ message: 'Application not found or already processed' });
      res.json({ message: 'Rejected', bus: updated });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to reject application' }); }
  },
  async remove(req, res) {
    try {
      const role = req.user?.role;
      if (!(isPrivileged(role) || role === 'buses')) return res.status(403).json({ message: 'Prohibido' });
      const ok = await deleteBus(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted' });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete bus' }); }
  },
  // Admin update (full access to all fields)
  async adminUpdate(req, res) {
    try {
      const role = req.user?.role;
      if (!(isPrivileged(role) || role === 'buses')) return res.status(403).json({ message: 'Prohibido' });
      const id = req.params.id;
      const body = req.body || {};
      const updated = await updateBus(id, body);
      if (!updated) return res.status(404).json({ message: 'Not found' });
      res.json(updated);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update bus' }); }
  },
  // GET /buses/:id -> get bus by MongoDB ObjectId
  async getById(req, res) {
    try {
      const id = req.params.id;
      const bus = await getBusById(id);
      if (!bus) return res.status(404).json({ message: 'Not found' });
      res.json(bus);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to get bus' }); }
  },
  // Driver: start service with initial location
  async startService(req, res) {
    try {
      console.log('[busesController.startService] body:', req.body);
      const { cedula, lat, lng } = req.body || {};
      if (!cedula) return res.status(400).json({ message: 'Cedula is required' });
      if (lat === undefined || lng === undefined) {
        return res.status(400).json({ message: 'Location (lat, lng) required' });
      }
      const updated = await startServiceByDriver(cedula, lat, lng);
      console.log('[busesController.startService] model returned:', updated);
      if (!updated) {
        return res.status(404).json({ message: 'No approved bus application found for this driver' });
      }
      res.json(updated);
    } catch (e) { 
      console.error('[startService] Error:', e); 
      res.status(500).json({ message: 'Failed to start service' }); 
    }
  },
  // Driver: stop service
  async stopService(req, res) {
    try {
      console.log('[busesController.stopService] body:', req.body);
      const { cedula } = req.body || {};
      if (!cedula) return res.status(400).json({ message: 'Cedula is required' });
      const updated = await stopServiceByDriver(cedula);
      console.log('[busesController.stopService] model returned:', updated);
      if (!updated) {
        return res.status(404).json({ message: 'No active service found for this driver to stop' });
      }
      res.json(updated);
    } catch (e) { 
      console.error('[stopService] Error:', e); 
      res.status(500).json({ message: 'Failed to stop service' }); 
    }
  },
  // Driver: update location (ping)
  async ping(req, res) {
    try {
      console.log('[busesController.ping] body:', req.body);
      const { cedula, lat, lng } = req.body || {};
      if (!cedula) return res.status(400).json({ message: 'Cedula is required' });
      if (lat === undefined || lng === undefined) {
        return res.status(400).json({ message: 'Location (lat, lng) required' });
      }

      // Update location in database
      const updated = await updateLocationByDriver(cedula, lat, lng);
      console.log('[busesController.ping] model returned:', updated);
      if (!updated) {
        return res.status(404).json({ message: 'No active service found for this driver to ping' });
      }

      // TWO-STAGE ROUTING LOGIC (like Uber)
      // Stage 1: Driver is going to pickup point (routeStart) - show route from current location to start
      // Stage 2: Driver is doing the route (routeStart -> routeEnd) - show the original route

      const routeWaypoints = updated.routeWaypoints;
      if (routeWaypoints && routeWaypoints.length > 0) {
        const currentStage = updated.stage || 'pickup';

        if (currentStage === 'pickup') {
          // Stage 1: Check if driver has arrived at start point
          console.log('[ping] Stage 1 - Going to pickup. Checking arrival...', {
            cedula,
            currentLat: lat,
            currentLng: lng,
            routeStart: updated.routeStart,
          });

          const arrived = hasArrivedAtStart(lat, lng, routeWaypoints, 100); // 100m radius

          if (arrived && !updated.arrivedAtStart) {
            console.log('[ping] Driver arrived at start point! Switching to route stage.', {
              cedula,
              routeStart: updated.routeStart,
              routeEnd: updated.routeEnd,
            });

            // Update stage to "route" and mark as arrived
            await updateBus(updated._id.toString(), { 
              stage: 'route',
              arrivedAtStart: true,
              updatedAt: new Date()
            });
            updated.stage = 'route';
            updated.arrivedAtStart = true;
          } else if (!arrived) {
            // Driver is still far from start point
            // Calculate route from current location to start point for navigation
            const isFar = isFarFromStart(lat, lng, routeWaypoints, 200); // 200m threshold
            
            if (isFar) {
              console.log('[ping] Driver is far from start. Calculating pickup route...', {
                cedula,
                currentLat: lat,
                currentLng: lng,
                routeStart: updated.routeStart,
              });

              try {
                // Calculate route from driver's current location to the start point
                const pickupRoute = await calculateRoute(
                  `${lat},${lng}`, 
                  updated.routeStart
                );
                
                if (pickupRoute && pickupRoute.length > 0) {
                  console.log('[ping] Pickup route calculated, showing to driver');
                  // Save the pickup route to database
                  await updateBus(updated._id.toString(), { 
                    displayRoute: pickupRoute,
                    pickupRoute: pickupRoute,
                    updatedAt: new Date()
                  });
                  updated.pickupRoute = pickupRoute;
                  updated.displayRoute = pickupRoute;
                } else {
                  // Fallback to original route if pickup route calculation fails
                  await updateBus(updated._id.toString(), { 
                    displayRoute: routeWaypoints,
                    updatedAt: new Date()
                  });
                  updated.displayRoute = routeWaypoints;
                }
              } catch (e) {
                console.error('[ping] Error calculating pickup route:', e);
                await updateBus(updated._id.toString(), { 
                  displayRoute: routeWaypoints,
                  updatedAt: new Date()
                });
                updated.displayRoute = routeWaypoints;
              }
            } else {
              // Close to start, show original route
              await updateBus(updated._id.toString(), { 
                displayRoute: routeWaypoints,
                updatedAt: new Date()
              });
              updated.displayRoute = routeWaypoints;
            }
          }
        }

        // CONSTANT CHECK: If on route and driver deviates, recalculate
        if (currentStage === 'route' || updated.stage === 'route') {
          const offRoute = isDriverOffRoute(lat, lng, routeWaypoints, 150); // 150 meters tolerance
          
          if (offRoute) {
            console.log('[ping] Driver off route, recalculating...', {
              cedula,
              currentLat: lat,
              currentLng: lng,
              routeStart: updated.routeStart,
              routeEnd: updated.routeEnd,
            });

            // Recalculate route (like Uber does)
            const newWaypoints = await calculateRoute(updated.routeStart, updated.routeEnd);
            if (newWaypoints.length > 0) {
              console.log('[ping] Route recalculated, updating bus record');
              // Update bus with new route
              await updateBus(updated._id.toString(), { 
                routeWaypoints: newWaypoints,
                displayRoute: newWaypoints,
                updatedAt: new Date()
              });
              updated.routeWaypoints = newWaypoints;
              updated.displayRoute = newWaypoints;
            }
          } else {
            // On route, show the main route
            if (!updated.displayRoute) {
              await updateBus(updated._id.toString(), { 
                displayRoute: routeWaypoints,
                updatedAt: new Date()
              });
            }
            updated.displayRoute = routeWaypoints;
          }
        }
      }

      res.json(updated);
      console.log('[ping] Response with routeColor:', { busId: updated.busId, routeColor: updated.routeColor });
    } catch (e) { 
      console.error('[ping] Error:', e); 
      res.status(500).json({ message: 'Failed to update location' }); 
    }
  },
};
