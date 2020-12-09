const authRouter = require('./auth.routes');
const userRouter = require('./user.routes');

module.exports = (app) => {
  app.use('/auth', authRouter);
  app.use('/users', userRouter);
};
