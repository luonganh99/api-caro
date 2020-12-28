const express = require('express');
const passport = require('passport');
const router = express.Router();

const UserController = require('../../controllers/user.controller');

router.get(
  '/:userId',
  passport.authenticate('jwt', { session: false }),
  UserController.getUserById,
);
router.patch(
  '/patch',
  passport.authenticate('jwt', { session: false }),
  UserController.patchUserInfo,
);
module.exports = router;
