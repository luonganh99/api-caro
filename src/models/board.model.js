const db = require('./db');

module.exports = {
  findById: async (boardId) => {
    const results = await db.get('board', { boardId });
    return results[0];
  },
  findByUserId: async (userId) => {
    const results = await db.load(
      `SELECT * FROM board WHERE hostId = ${userId} OR guestId = ${userId}`,
    );
    return results;
  },
  create: async (board) => {
    const result = await db.add('board', board);
    return result.insertId;
  },
  update: (entity, condition) => db.update('board', entity, condition),
};
