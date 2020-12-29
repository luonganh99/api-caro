const db = require('./db');

module.exports = {
  findById: async (chatId) => {
    const results = await db.get('chat', { chatId });
    return results[0];
  },
  create: async (chat) => {
    const result = await db.add('chat', chat);
    return result.insertId;
  },
  update: (entity, condition) => db.update('chat', entity, condition),
  findByBoardId: (boardId) =>
    db.load(`SELECT * FROM chat WHERE boardId = ${boardId} ORDER BY createdAt ASC`),
};
