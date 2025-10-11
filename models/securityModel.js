import { getDb, ObjectId } from '../lib/mongoClient.js';

export async function listHotspots() {
  const db = await getDb();
  return await db.collection('hotSpots').find({}).sort({ date: -1 }).toArray();
}

export async function createHotspot(h) {
  const db = await getDb();
  const doc = {
    title: h.title,
    description: h.description,
    date: h.date ? new Date(h.date) : new Date(),
    dangerTime: h.dangertime || null,
    dangerLevel: h.dangerlevel || 'low',
    author: h.author,
  };
  const { insertedId } = await db.collection('hotSpots').insertOne(doc);
  return { _id: insertedId, ...doc };
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
  const res = await db.collection('hotSpots').deleteOne({ _id });
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
  };
  const res = await db.collection('hotSpots').findOneAndUpdate(
    { _id },
    { $set: update },
    { returnDocument: 'after' }
  );
  return res.value ? { _id: res.value._id, ...res.value } : null;
}
