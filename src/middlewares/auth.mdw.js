const jwt = require('jsonwebtoken');

module.exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ status: 'error', message: 'Access Denied' });

  jwt.verify(token, process.env.SECRET_TOKEN, (err, decodedToken) => {
    if (err) return res.status(403).json({ status: 'error', message: 'Invalid Token' });
    req.userInfo = decodedToken;
    next();
  });
};
