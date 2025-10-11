import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.warn('MONGO_URI is not set. Mongo features will be disabled until it is provided.');
}

let client;
let db;

export async function getDb() {
  if (!uri) throw new Error('MONGO_URI is missing');
  if (!client) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  }
  if (!db) {
    await client.connect();
    // Use a default database name; Mongo Atlas allows choosing any. We'll use 'comet'.
    db = client.db('comet');
  }
  return db;
}

export { ObjectId };
