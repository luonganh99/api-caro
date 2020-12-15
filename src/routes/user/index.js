const authRouter = require('./auth.routes');
const userRouter = require('./user.routes');
const boardRouter = require('./board.routes');

module.exports = (app) => {
  app.use('/auth', authRouter);
  app.use('/users', userRouter);
  app.use('/boards', boardRouter);
};
