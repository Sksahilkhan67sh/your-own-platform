// A minimal in-memory stand-in for a Mongoose Model, supporting just the
// methods authService.js actually calls. This lets integration tests
// exercise the REAL authService.js logic (rotation, reuse detection,
// lockout) against realistic async, document-mutating behavior, without
// requiring a live MongoDB connection (unavailable in this sandbox).

let idCounter = 1;
function nextId() {
  return `fake-id-${idCounter++}`;
}

export function createFakeCollection(initialDocs = [], { instanceMethods = {} } = {}) {
  const docs = new Map(initialDocs.map((d) => [d._id, { ...d }]));

  function wrapDoc(raw) {
    if (!raw) return null;
    const doc = { ...raw };

    doc.save = async () => {
      const { save: _s, deleteOne: _d, ...persistable } = doc;
      docs.set(doc._id, { ...persistable });
      return doc;
    };
    doc.deleteOne = async () => {
      docs.delete(doc._id);
    };

    for (const [name, fn] of Object.entries(instanceMethods)) {
      doc[name] = fn.bind(doc);
    }

    return doc;
  }

  function matches(doc, query) {
    return Object.entries(query).every(([key, value]) => {
      if (value && typeof value === 'object' && value.$ne !== undefined) {
        const actual = doc[key] ?? null;
        const target = value.$ne ?? null;
        return actual !== target;
      }
      // MongoDB treats a missing/undefined field as equivalent to null when
      // querying for { field: null } — mirror that here, since
      // authService.js relies on exactly this semantic (RefreshToken docs
      // never explicitly set revokedAt: null at creation time).
      const actual = doc[key] ?? null;
      const target = value ?? null;
      return actual === target;
    });
  }

  return {
    _docs: docs,

    findOne(query) {
      // Returns a thenable that also supports .select() chaining, mirroring
      // Mongoose's query builder enough for authService.js's actual usage
      // (`User.findOne(...).select('+passwordHash')`).
      const resolve = async () => {
        for (const doc of docs.values()) {
          if (matches(doc, query)) return wrapDoc(doc);
        }
        return null;
      };

      const thenable = {
        select() {
          return thenable;
        },
        then(onFulfilled, onRejected) {
          return resolve().then(onFulfilled, onRejected);
        },
        catch(onRejected) {
          return resolve().catch(onRejected);
        },
      };
      return thenable;
    },

    async findById(id) {
      const doc = docs.get(id);
      return doc ? wrapDoc(doc) : null;
    },

    async create(data) {
      const _id = data._id || nextId();
      const doc = { ...data, _id, createdAt: new Date() };
      docs.set(_id, doc);
      return wrapDoc(doc);
    },

    async updateMany(query, update) {
      let count = 0;
      for (const [id, doc] of docs.entries()) {
        if (matches(doc, query)) {
          const setFields = update.$set || {};
          docs.set(id, { ...doc, ...setFields });
          count += 1;
        }
      }
      return { modifiedCount: count };
    },
  };
}
