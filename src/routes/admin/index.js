const authRouter = require('./auth.routes');
const mangeUserRouter = require('./manage.user.routes');
const mangeBoardRouter = require('./manage.board.routes');

module.exports = (app) => {
  app.use('/admin/auth', authRouter);
  app.use('/admin/manage/users', mangeUserRouter);
  app.use('/admin/manage/boards', mangeBoardRouter);
};
