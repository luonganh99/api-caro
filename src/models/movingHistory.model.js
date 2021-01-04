const db = require('./db');

module.exports = {
  findById: async (movingId) => {
    const results = await db.get('moving_history', { movingId });
    return results[0];
  },
  findByBoardId: async (boardId) => {
    const results = await db.get('moving_history', { boardId });
    return results;
  },
  create: async (moving) => {
    const result = await db.add('moving_history', moving);
    return result.insertId;
  },
  update: (entity, condition) => db.update('moving_history', entity, condition),
};
