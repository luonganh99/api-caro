const jwt = require('jsonwebtoken');

module.exports = (user) => {
  return jwt.sign({ ...user }, process.env.SECRET_TOKEN, {
    expiresIn: 60 * 60 * 24,
  });
};
