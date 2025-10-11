import { getDb, ObjectId } from '../lib/mongoClient.js';

export async function listPosts() {
  const db = await getDb();
  const docs = await db.collection('userPosts').find({}).sort({ date: -1 }).toArray();
  return docs.map(d => ({ ...d, _id: String(d._id) }));
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
  return { _id: String(insertedId), ...doc };
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

export async function listComments(postId) {
  const db = await getDb();
  const docs = await db.collection('comments').find({ post: new ObjectId(postId) }).sort({ date: 1 }).toArray();
  return docs.map(d => ({ ...d, _id: String(d._id) }));
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
  return { _id: String(insertedId), ...doc };
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
