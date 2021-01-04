const passport = require('passport');

const authRouter = require('./auth.routes');
const userRouter = require('./user.routes');
const boardRouter = require('./board.routes');
const chatRouter = require('./chat.routes');
const movingHistoryRouter = require('./movingHistory.routes');

module.exports = (app) => {
  app.use('/auth', authRouter);
  app.use('/users', userRouter);
  app.use('/boards', boardRouter);
  app.use('/moving-history', passport.authenticate('jwt', { session: false }), movingHistoryRouter);
  app.use('/chat', passport.authenticate('jwt', { session: false }), chatRouter);
};
