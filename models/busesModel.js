import { getDb, ObjectId } from '../lib/mongoClient.js';

const BUSES_COLL = 'buses';

export async function createBusApplication(app) {
  const db = await getDb();
  // Check if user already has an application
  const existing = await db.collection(BUSES_COLL).findOne({ driverCedula: app.driverCedula });
  if (existing) throw new Error('Ya existe una solicitud para este usuario');
  
  const doc = {
    driverCedula: app.driverCedula, // User's cedula (immutable)
    busNumber: app.busNumber,
    busId: app.busId,
    routeStart: app.routeStart,
    routeEnd: app.routeEnd || '',
    routeWaypoints: Array.isArray(app.routeWaypoints) ? app.routeWaypoints : [], // Auto-calculated by backend
    routeColor: app.routeColor || '#3B82F6', // Color elegido por el conductor
    fee: Number(app.fee) || 0,
    driverLicense: app.driverLicense,
    status: 'pending', // pending -> approved -> rejected
    isActive: false, // Service status (true when driver is transmitting location)
    stage: 'pickup', // pickup (going to start point) or route (doing the route)
    arrivedAtStart: false, // True once driver reaches start point
    lat: null,
    lng: null,
    lastLocationUpdate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const { insertedId } = await db.collection(BUSES_COLL).insertOne(doc);
  return await db.collection(BUSES_COLL).findOne({ _id: insertedId });
}

export async function listBuses(filter = {}) {
  const db = await getDb();
  return await db.collection(BUSES_COLL).find(filter).sort({ updatedAt: -1 }).toArray();
}

export async function listActiveBuses() {
  // Return buses that are approved and currently active (transmitting location)
  return await listBuses({ status: 'approved', isActive: true });
}

export async function getBusById(id) {
  const db = await getDb();
  try {
    const _id = new ObjectId(id);
    return await db.collection(BUSES_COLL).findOne({ _id });
  } catch {
    return null;
  }
}

export async function updateBus(id, updates) {
  const db = await getDb();
  const _id = new ObjectId(id);
  const set = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) set[k] = v;
  }
  const res = await db.collection(BUSES_COLL).findOneAndUpdate({ _id }, { $set: set }, { returnDocument: 'after' });
  return res.value || null;
}

export async function deleteBus(id) {
  const db = await getDb();
  const _id = new ObjectId(id);
  const res = await db.collection(BUSES_COLL).deleteOne({ _id });
  return res.deletedCount > 0;
}

export async function startServiceByDriver(driverCedula, lat, lng) {
  const db = await getDb();
  const query = { driverCedula: String(driverCedula), status: 'approved' };
  console.log('[busesModel.startServiceByDriver] query:', query, 'lat:', lat, 'lng:', lng);
  const res = await db.collection(BUSES_COLL).findOneAndUpdate(
    query,
    { 
      $set: { 
        isActive: true,
        stage: 'pickup', // Start in pickup stage (going to start point)
        arrivedAtStart: false,
        displayRoute: [], // Will be set on first ping
        lat: Number(lat),
        lng: Number(lng),
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      } 
    },
    { returnDocument: 'after' }
  );
  console.log('[busesModel.startServiceByDriver] raw response - isActive:', res?.isActive, '_id:', res?._id);
  // Handle both possible return formats: direct document or { value: document }
  const result = res?._id ? res : (res?.value || null);
  console.log('[busesModel.startServiceByDriver] final result - isActive:', result?.isActive, 'driverCedula:', result?.driverCedula);
  return result;
}

export async function stopServiceByDriver(driverCedula) {
  const db = await getDb();
  const query = { driverCedula: String(driverCedula), status: 'approved', isActive: true };
  console.log('[busesModel.stopServiceByDriver] query:', query);
  const res = await db.collection(BUSES_COLL).findOneAndUpdate(
    query,
    { 
      $set: { 
        isActive: false,
        updatedAt: new Date()
      } 
    },
    { returnDocument: 'after' }
  );
  console.log('[busesModel.stopServiceByDriver] raw response - isActive:', res?.isActive, '_id:', res?._id);
  // Handle both possible return formats: direct document or { value: document }
  const result = res?._id ? res : (res?.value || null);
  console.log('[busesModel.stopServiceByDriver] final result - isActive:', result?.isActive, 'driverCedula:', result?.driverCedula);
  return result;
}

export async function updateLocationByDriver(driverCedula, lat, lng) {
  const db = await getDb();
  const query = { driverCedula: String(driverCedula), status: 'approved', isActive: true };
  console.log('[busesModel.updateLocationByDriver] query:', query, 'lat:', lat, 'lng:', lng);
  const res = await db.collection(BUSES_COLL).findOneAndUpdate(
    query,
    { 
      $set: { 
        lat: Number(lat),
        lng: Number(lng),
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      } 
    },
    { returnDocument: 'after' }
  );
  console.log('[busesModel.updateLocationByDriver] raw response:', res);
  // Handle both possible return formats: direct document or { value: document }
  return res?._id ? res : (res?.value || null);
}

export async function approveBus(busId) {
  const db = await getDb();
  const _id = new ObjectId(busId);
  const res = await db.collection(BUSES_COLL).findOneAndUpdate(
    { _id, status: 'pending' },
    { $set: { status: 'approved', updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return res.value || null;
}

export async function rejectBus(busId) {
  const db = await getDb();
  const _id = new ObjectId(busId);
  const res = await db.collection(BUSES_COLL).findOneAndUpdate(
    { _id, status: 'pending' },
    { $set: { status: 'rejected', updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return res.value || null;
}

export function getBusesCollectionName() { return BUSES_COLL; }

export async function findApplicationForUser(cedula) {
  const db = await getDb();
  return await db.collection(BUSES_COLL).findOne({ driverCedula: cedula });
}

export async function getDriverServiceStatus(cedula) {
  const db = await getDb();
  const bus = await db.collection(BUSES_COLL).findOne({
    driverCedula: String(cedula),
    status: 'approved'
  });

  if (!bus) return null;

  return {
    hasApplication: true,
    isActive: bus.isActive || false,
    bus: bus
  };
}
