const express = require('express');
const router = express.Router();
const passport = require('passport');

const authController = require('../../controllers/auth.controller');

router.post('/login', authController.userLogin);
router.post('/signup', authController.signup);
router.get(
  '/google',
  passport.authenticate('google-token', { session: false }),
  authController.google,
);
router.get(
  '/facebook',
  passport.authenticate('facebook-token', { session: false }),
  authController.facebook,
);

module.exports = router;
