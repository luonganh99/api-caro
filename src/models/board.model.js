const db = require('./db');

module.exports = {
  findById: async (boardId) => {
    const results = await db.get('board', { boardId });
    return results[0];
  },
  findByUsername: async (username) => {
    const results = await db.load(
      `SELECT * FROM board WHERE (hostname = '${username}' OR guestname = '${username}') AND status = 1`,
    );
    return results;
  },
  create: async (board) => {
    const result = await db.add('board', board);
    return result.insertId;
  },
  update: (entity, condition) => db.update('board', entity, condition),
  getAll: async () => db.getAll('board'),

  findByIdUserId: async (userId) => {
    return db.load(`SELECT board.* FROM board JOIN user ON board.hostname = user.username OR board.guestname = user.username
    WHERE user.userId = ${userId}`);
  },
};
