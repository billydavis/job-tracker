import { MongoClient, ObjectId } from 'mongodb';

let client: MongoClient | null = null;

function getUri() {
  return process.env.MONGO_URI ?? 'mongodb://localhost:27017';
}

function getDbName() {
  return process.env.MONGO_DB ?? 'job-tracker';
}

export async function connect() {
  if (!client) {
    const uri = getUri();
    client = new MongoClient(uri);
    await client.connect();
  }
  const dbName = getDbName();
  return client.db(dbName);
}

export function getObjectId(id: string) {
  return new ObjectId(id);
}

export async function getCollection(name: string) {
  const db = await connect();
  return db.collection(name);
}
