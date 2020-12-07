const authRouter = require('./auth.routes');

module.exports = (app) => {
  app.use('/admin/auth', authRouter);
};
