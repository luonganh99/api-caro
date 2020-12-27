const authRouter = require('./auth.routes');
const mangeUserRouter = require('./manage.user.routes');

module.exports = (app) => {
  app.use('/admin/auth', authRouter);
  app.use('/admin/manage/users', mangeUserRouter);
};
