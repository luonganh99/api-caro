const jwt = require('jsonwebtoken');

module.exports = (data, expiresIn) => {
  return jwt.sign({ ...data }, process.env.SECRET_TOKEN, {
    expiresIn,
  });
};
