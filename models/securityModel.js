import { getDb, ObjectId } from '../lib/mongoClient.js';

const HOTSPOTS_COLL = 'hotSpots';
const OLD_HOTSPOTS_COLL = 'hotSpotsV2';

export async function listHotspots() {
  const db = await getDb();
  console.log('[securityModel.listHotspots] Using collection:', HOTSPOTS_COLL);
  // One-time silent migration if old collection has docs and new one is empty
  try {
    const target = db.collection(HOTSPOTS_COLL);
    const old = db.collection(OLD_HOTSPOTS_COLL);
    const [targetCount, oldCount] = await Promise.all([
      target.estimatedDocumentCount(),
      old.estimatedDocumentCount().catch(() => 0)
    ]);
    if (targetCount === 0 && oldCount > 0) {
      const docs = await old.find({}).toArray();
      if (docs.length) {
        await target.insertMany(docs, { ordered: false }).catch(() => {});
      }
    }
  } catch {}
  return await db.collection(HOTSPOTS_COLL).find({}).sort({ date: -1 }).toArray();
}

export async function getHotspotById(id) {
  const db = await getDb();
  try {
    const _id = new ObjectId(id);
    return await db.collection(HOTSPOTS_COLL).findOne({ _id });
  } catch {
    return null;
  }
}

export async function createHotspot(h) {
  const db = await getDb();
  // Normalize latitude/longitude from possible string or alternate field names
  const rawLat = h.lat !== undefined ? h.lat : (h.latitude !== undefined ? h.latitude : undefined);
  const rawLng = h.lng !== undefined ? h.lng : (h.longitude !== undefined ? h.longitude : undefined);
  const normLat = rawLat !== undefined && rawLat !== null && rawLat !== '' ? Number(rawLat) : undefined;
  const normLng = rawLng !== undefined && rawLng !== null && rawLng !== '' ? Number(rawLng) : undefined;
  const doc = {
    title: h.title,
    description: h.description,
    date: h.date ? new Date(h.date) : new Date(),
    dangerTime: h.dangertime || null,
    dangerLevel: h.dangerlevel || 'low',
    author: h.author,
    // Optional geolocation fields
    lat: Number.isFinite(normLat) ? normLat : undefined,
    lng: Number.isFinite(normLng) ? normLng : undefined,
    plusCode: h.plusCode || h.pluscode || undefined,
    placeId: h.placeId || undefined,
    address: h.address || undefined,
  };
  // If both lat/lng are present, add a GeoJSON location and ensure 2dsphere index
  if (Number.isFinite(normLat) && Number.isFinite(normLng)) {
    doc.location = { type: 'Point', coordinates: [normLng, normLat] };
    // Idempotent index creation
    db.collection(HOTSPOTS_COLL).createIndex({ location: '2dsphere' }).catch(() => {});
  }
  console.log('[securityModel.createHotspot] DB:', db.databaseName, 'COLL:', HOTSPOTS_COLL, 'inserting doc:', doc);
  const { insertedId } = await db.collection(HOTSPOTS_COLL).insertOne(doc);
  console.log('[securityModel.createHotspot] inserted _id:', insertedId);
  const saved = await db.collection(HOTSPOTS_COLL).findOne({ _id: insertedId });
  return saved;
}

export async function listHotspotComments(hotspotId) {
  const db = await getDb();
  return await db.collection('hotSpotsComments').find({ post: new ObjectId(hotspotId) }).sort({ date: 1 }).toArray();
}

export async function addHotspotComment(hotspotId, c) {
  const db = await getDb();
  const doc = { content: c.content, date: new Date(), post: new ObjectId(hotspotId), author: c.author };
  const { insertedId } = await db.collection('hotSpotsComments').insertOne(doc);
  return { _id: insertedId, ...doc };
}

export async function deleteHotspot(id) {
  const db = await getDb();
  const _id = new ObjectId(id);
  await db.collection('hotSpotsComments').deleteMany({ post: _id });
  const res = await db.collection(HOTSPOTS_COLL).deleteOne({ _id });
  return res.deletedCount > 0;
}

export async function updateHotspot(id, u) {
  const db = await getDb();
  const _id = new ObjectId(id);
  const update = {
    ...(u.title !== undefined ? { title: u.title } : {}),
    ...(u.description !== undefined ? { description: u.description } : {}),
    ...(u.date ? { date: new Date(u.date) } : {}),
    ...(u.dangertime !== undefined ? { dangerTime: u.dangertime } : {}),
    ...(u.dangerlevel !== undefined ? { dangerLevel: u.dangerlevel } : {}),
    ...(u.author !== undefined ? { author: u.author } : {}),
    ...(u.lat !== undefined ? { lat: typeof u.lat === 'number' ? u.lat : Number(u.lat) } : {}),
    ...(u.lng !== undefined ? { lng: typeof u.lng === 'number' ? u.lng : Number(u.lng) } : {}),
    ...(u.plusCode !== undefined ? { plusCode: u.plusCode } : {}),
    ...(u.placeId !== undefined ? { placeId: u.placeId } : {}),
    ...(u.address !== undefined ? { address: u.address } : {}),
  };
  // If both lat and lng are provided in this update, update the GeoJSON location
  const hasLat = u.lat !== undefined;
  const hasLng = u.lng !== undefined;
  if (hasLat && hasLng) {
    const nlat = typeof u.lat === 'number' ? u.lat : Number(u.lat);
    const nlng = typeof u.lng === 'number' ? u.lng : Number(u.lng);
    if (Number.isFinite(nlat) && Number.isFinite(nlng)) {
      update.location = { type: 'Point', coordinates: [nlng, nlat] };
      db.collection(HOTSPOTS_COLL).createIndex({ location: '2dsphere' }).catch(() => {});
    }
  }
  const res = await db.collection(HOTSPOTS_COLL).findOneAndUpdate(
    { _id },
    { $set: update },
    { returnDocument: 'after' }
  );
  console.log('[securityModel.updateHotspot] update set:', update, 'result:', res.value);
  return res.value ? { _id: res.value._id, ...res.value } : null;
}

export function getHotspotsCollectionName() { return HOTSPOTS_COLL; }
