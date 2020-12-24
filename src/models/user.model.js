const db = require('./db');

module.exports = {
  findById: async (userId) => {
    const results = await db.get('user', { userId });
    return results[0];
  },
  findByUsername: async (username) => {
    const results = await db.get('user', { username });
    return results[0];
  },
  findByEmail: async (email) => {
    const results = await db.get('user', { email });
    return results[0];
  },
  findByExternalId: async (externalId) => {
    const results = await db.get('user', { externalId });
    return results[0];
  },
  create: async (user) => {
    const result = await db.add('user', user);
    return result.insertId;
  },
  patch: (entity, condition) => db.update('user', entity, condition),
};
