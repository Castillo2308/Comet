import { getDb, ObjectId } from '../lib/mongoClient.js';
import { neonClient as sql } from '../lib/neonClient.js';

function isCedula(value) {
  return typeof value === 'string' && /^\d{5,12}$/.test(value);
}

async function fetchNamesByCedula(cedulas) {
  if (!cedulas?.length) return {};
  try {
    // Use ANY($1) with an array parameter for efficiency
    const rows = await sql`select cedula, name, lastname from users where cedula = any(${cedulas})`;
    const map = {};
    for (const r of rows) {
      const full = `${r.name || ''} ${r.lastname || ''}`.trim();
      if (r.cedula && full) map[String(r.cedula)] = full;
    }
    return map;
  } catch {
    return {};
  }
}

export async function listPosts() {
  const db = await getDb();
  const docs = await db.collection('userPosts').find({}).sort({ date: -1 }).toArray();
  const cedulas = [...new Set(docs.map(d => d.author).filter(isCedula))];
  const nameMap = await fetchNamesByCedula(cedulas);
  return docs.map(d => ({
    ...d,
    _id: String(d._id),
    authorName: nameMap[d.author] || (typeof d.author === 'string' && d.author.includes(' ') ? d.author : undefined),
  }));
}

export async function createPost(post) {
  const db = await getDb();
  const doc = {
    content: post.content,
    photo_link: post.photo_link || null,
    likes: 0,
    comments_count: 0,
    date: post.date ? new Date(post.date) : new Date(),
    author: post.author,
  };
  const { insertedId } = await db.collection('userPosts').insertOne(doc);
  let authorName;
  if (isCedula(doc.author)) {
    const map = await fetchNamesByCedula([doc.author]);
    authorName = map[doc.author];
  } else if (typeof doc.author === 'string' && doc.author.includes(' ')) {
    authorName = doc.author;
  }
  return { _id: String(insertedId), ...doc, authorName };
}

export async function toggleLikePost(id, inc = 1) {
  const db = await getDb();
  const _id = new ObjectId(id);
  const res = await db.collection('userPosts').findOneAndUpdate({ _id }, { $inc: { likes: inc } }, { returnDocument: 'after' });
  return res.value ? { ...res.value, _id: String(res.value._id) } : null;
}

export async function deletePost(id) {
  const db = await getDb();
  const _id = new ObjectId(id);
  await db.collection('comments').deleteMany({ post: _id });
  const res = await db.collection('userPosts').deleteOne({ _id });
  return res.deletedCount > 0;
}

export async function getPostById(id) {
  const db = await getDb();
  try {
    const _id = new ObjectId(id);
    return await db.collection('userPosts').findOne({ _id });
  } catch {
    return null;
  }
}

export async function updatePost(id, updates) {
  const db = await getDb();
  const _id = new ObjectId(id);
  const set = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'content')) set.content = updates.content;
  if (Object.prototype.hasOwnProperty.call(updates, 'photo_link')) set.photo_link = updates.photo_link;
  const res = await db.collection('userPosts').findOneAndUpdate(
    { _id },
    { $set: set },
    { returnDocument: 'after' }
  );
  return res.value ? { ...res.value, _id: String(res.value._id) } : null;
}

export async function listComments(postId) {
  const db = await getDb();
  const docs = await db.collection('comments').find({ post: new ObjectId(postId) }).sort({ date: 1 }).toArray();
  const cedulas = [...new Set(docs.map(d => d.author).filter(isCedula))];
  const nameMap = await fetchNamesByCedula(cedulas);
  return docs.map(d => ({
    ...d,
    _id: String(d._id),
    authorName: nameMap[d.author] || (typeof d.author === 'string' && d.author.includes(' ') ? d.author : undefined),
  }));
}

export async function addComment(postId, comment) {
  const db = await getDb();
  const doc = {
    content: comment.content,
    likes: 0,
    date: new Date(),
    post: new ObjectId(postId),
    author: comment.author,
  };
  const { insertedId } = await db.collection('comments').insertOne(doc);
  await db.collection('userPosts').updateOne({ _id: new ObjectId(postId) }, { $inc: { comments_count: 1 } });
  let authorName;
  if (isCedula(doc.author)) {
    const map = await fetchNamesByCedula([doc.author]);
    authorName = map[doc.author];
  } else if (typeof doc.author === 'string' && doc.author.includes(' ')) {
    authorName = doc.author;
  }
  return { _id: String(insertedId), ...doc, authorName };
}

export async function likeComment(id, inc = 1) {
  const db = await getDb();
  const res = await db.collection('comments').findOneAndUpdate({ _id: new ObjectId(id) }, { $inc: { likes: inc } }, { returnDocument: 'after' });
  return res.value ? { ...res.value, _id: String(res.value._id) } : null;
}

export async function deleteComment(id) {
  const db = await getDb();
  const _id = new ObjectId(id);
  const comment = await db.collection('comments').findOne({ _id });
  if (!comment) return false;
  await db.collection('comments').deleteOne({ _id });
  if (comment.post) {
    await db.collection('userPosts').updateOne({ _id: new ObjectId(comment.post) }, { $inc: { comments_count: -1 } });
  }
  return true;
}

export async function getCommentById(id) {
  const db = await getDb();
  try {
    const _id = new ObjectId(id);
    return await db.collection('comments').findOne({ _id });
  } catch {
    return null;
  }
}
