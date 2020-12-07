const jwt = require('jsonwebtoken');

module.exports = (userId) => {
  return jwt.sign({ userId }, process.env.SECRET_TOKEN, {
    expiresIn: 60 * 60 * 24,
  });
};
