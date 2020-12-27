module.exports = (req, res, next) => {
  res.header('Content-Range', 'users 0-20/20');
  res.header('Access-Control-Expose-Headers', 'Content-Range');
  next();
};
