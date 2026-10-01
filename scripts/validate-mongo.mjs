// Validates that every Mongoose schema builds and every seed document passes
// schema validation — i.e. the MongoDB path is structurally correct even
// though we cannot run a live mongod in this sandbox.
import mongoose from "mongoose";

// Alias @/ to src/ so the server modules' imports resolve.
import { createRequire } from "module";
import { pathToFileURL } from "url";
import { register } from "node:module";

register(new URL("./alias-loader.mjs", import.meta.url));

const { buildMongooseModels } = await import("../src/server/mongo-models.js");
const { buildSeedDocs } = await import("../src/server/seed.js");

const models = buildMongooseModels();
const docs = buildSeedDocs();

let total = 0, failed = 0;
for (const [name, items] of Object.entries(docs)) {
  const Model = models[name];
  if (!Model) { console.log(`MISSING MODEL: ${name}`); failed++; continue; }
  for (const item of items) {
    total++;
    const doc = new Model(item);
    const err = doc.validateSync();
    if (err) {
      failed++;
      console.log(`INVALID ${name} (${item._id}): ${Object.values(err.errors).map(e=>e.message).join("; ")}`);
    }
  }
}
console.log(`\nValidated ${total} seed docs across ${Object.keys(docs).length} collections. Failures: ${failed}`);
console.log("Models built:", Object.keys(models).length);
process.exit(failed ? 1 : 0);
