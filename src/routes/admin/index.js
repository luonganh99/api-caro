const authRouter = require('./auth.routes');
const mangeUserRouter = require('./manage.user.routes');
const mangeBoardRouter = require('./manage.board.routes');
const passport = require('passport');

module.exports = (app) => {
  app.use('/admin/auth', authRouter);
  app.use('/admin/manage/users', passport.authenticate('jwt', { session: false }), mangeUserRouter);
  app.use('/admin/manage/boards', mangeBoardRouter);
};
