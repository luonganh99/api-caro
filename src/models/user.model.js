const db = require('./db');

module.exports = {
  findByUsername: async (username) => {
    const results = await db.get('user', { username });
    return results[0];
  },
  create: async (user) => {
    const result = await db.add('user', user);
    return result.insertId;
  },
};
