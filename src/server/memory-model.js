// Minimal mongoose-compatible in-memory model used when MONGODB_URI is not set.
// Supports the subset of the API used by this app: find/findOne/findById/create/
// insertMany/updateOne/deleteOne/countDocuments, .sort(), .lean(), doc.save(),
// filters with equality, $in, $ne, $or, $gte, $lte.

let counter = 0;
function newId() {
  counter += 1;
  const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  return `${Date.now().toString(16).padStart(12, "0")}${rand}${counter.toString(16).padStart(4, "0")}`.slice(0, 24);
}

function matches(doc, filter = {}) {
  for (const [key, cond] of Object.entries(filter)) {
    if (key === "$or") {
      if (!cond.some((sub) => matches(doc, sub))) return false;
      continue;
    }
    const value = doc[key];
    if (cond !== null && typeof cond === "object" && !Array.isArray(cond)) {
      for (const [op, expected] of Object.entries(cond)) {
        if (op === "$in" && !expected.includes(value)) return false;
        if (op === "$ne" && value === expected) return false;
        if (op === "$gte" && !(value >= expected)) return false;
        if (op === "$lte" && !(value <= expected)) return false;
      }
    } else if (value !== cond) {
      return false;
    }
  }
  return true;
}

function clone(obj) {
  return obj === undefined ? obj : JSON.parse(JSON.stringify(obj));
}

export function createMemoryModel(name, seedDocs = []) {
  const docs = new Map();
  for (const d of seedDocs) {
    const doc = clone(d);
    doc._id = doc._id || newId();
    docs.set(String(doc._id), doc);
  }

  class Query {
    constructor(filter) {
      this._filter = filter || {};
      this._sort = null;
    }
    sort(spec) {
      this._sort = spec;
      return this;
    }
    lean() {
      return this;
    }
    then(onFulfilled, onRejected) {
      // Correct Promise/A+ behaviour: supports both adoption (`await query`)
      // and chaining (`query.then(fn)` resolves with fn's return value).
      const run = async () => {
        let out = [...docs.values()].filter((d) => matches(d, this._filter)).map(clone);
        if (this._sort) {
          const entries = Object.entries(this._sort);
          out.sort((a, b) => {
            for (const [k, dir] of entries) {
              if (a[k] < b[k]) return dir > 0 ? -1 : 1;
              if (a[k] > b[k]) return dir > 0 ? 1 : -1;
            }
            return 0;
          });
        }
        return out;
      };
      return run().then(onFulfilled, onRejected);
    }
  }

  const Model = {
    modelName: name,
    find(filter) {
      return new Query(filter);
    },
    async findOne(filter) {
      const found = [...docs.values()].find((d) => matches(d, filter));
      return found ? wrap(found) : null;
    },
    async findById(id) {
      const found = docs.get(String(id));
      return found ? wrap(found) : null;
    },
    async create(payload) {
      const items = Array.isArray(payload) ? payload : [payload];
      const created = items.map((d) => {
        const doc = clone(d);
        doc._id = doc._id || newId();
        docs.set(String(doc._id), doc);
        return wrap(doc);
      });
      return Array.isArray(payload) ? created : created[0];
    },
    async insertMany(items) {
      return this.create(items);
    },
    async updateOne(filter, update) {
      const target = [...docs.values()].find((d) => matches(d, filter));
      if (!target) return { matchedCount: 0, modifiedCount: 0 };
      if (update.$set) Object.assign(target, clone(update.$set));
      if (update.$push) {
        for (const [k, v] of Object.entries(update.$push)) {
          if (!Array.isArray(target[k])) target[k] = [];
          target[k].push(clone(v));
        }
      }
      return { matchedCount: 1, modifiedCount: 1 };
    },
    async deleteOne(filter) {
      const target = [...docs.values()].find((d) => matches(d, filter));
      if (!target) return { deletedCount: 0 };
      docs.delete(String(target._id));
      return { deletedCount: 1 };
    },
    async deleteMany(filter = {}) {
      let n = 0;
      for (const d of [...docs.values()]) {
        if (matches(d, filter)) {
          docs.delete(String(d._id));
          n += 1;
        }
      }
      return { deletedCount: n };
    },
    async countDocuments(filter = {}) {
      return [...docs.values()].filter((d) => matches(d, filter)).length;
    },
  };

  function wrap(doc) {
    return {
      ...doc,
      async save() {
        docs.set(String(this._id), clone({ ...this, save: undefined }));
        return this;
      },
      toObject() {
        const { save, toObject, toJSON, ...rest } = this;
        return clone(rest);
      },
      toJSON() {
        return this.toObject();
      },
    };
  }

  return Model;
}
