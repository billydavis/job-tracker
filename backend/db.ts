import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URI ?? 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB ?? 'job-tracker';

let client: MongoClient | null = null;

export async function connect() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

export function getObjectId(id: string) {
  return new ObjectId(id);
}

export async function getCollection(name: string) {
  const db = await connect();
  return db.collection(name);
}
