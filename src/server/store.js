import { createMemoryModel } from "./memory-model";
import { buildSeedDocs, applySeed } from "./seed";

// Backend selection:
// - If MONGODB_URI is set → real MongoDB via Mongoose (persists across restarts).
// - Otherwise → in-memory mongoose-compatible store seeded with demo data,
//   so the app is fully functional in development without infrastructure.

const uri = process.env.MONGODB_URI?.trim();
export const USING_MONGO = Boolean(uri);

let models = null;
let readyPromise = null;

function buildMemoryModels() {
  const docs = buildSeedDocs();
  const out = {};
  for (const [name, items] of Object.entries(docs)) {
    out[name] = createMemoryModel(name, items);
  }
  return out;
}

async function connectMongo() {
  const mongoose = (await import("mongoose")).default;
  mongoose.set("strictQuery", true);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  }
  const { buildMongooseModels } = await import("./mongo-models");
  const m = buildMongooseModels();
  const seeded = await applySeed(m);
  if (seeded.length) {
    console.log(`[db] MongoDB connected — seeded: ${seeded.join(", ")}`);
  } else {
    console.log("[db] MongoDB connected — data already present");
  }
  return m;
}

/** Await before any model access. Failed connections are retried on next call. */
export function getStore() {
  if (!readyPromise) {
    readyPromise = USING_MONGO
      ? connectMongo().then((m) => {
          models = m;
          return m;
        })
      : Promise.resolve().then(() => {
          models = buildMemoryModels();
          console.log("[db] MONGODB_URI not set — using in-memory demo store");
          return models;
        });
    readyPromise.catch(() => {
      // Allow the next request to retry the connection.
      readyPromise = null;
    });
  }
  return readyPromise;
}

/** (model) shortcut for handlers: const { Page } = await db(); */
export async function db() {
  if (!models) await getStore();
  return models;
}

export function dataSource() {
  return USING_MONGO ? "mongodb" : "memory";
}
