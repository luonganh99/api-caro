const express = require('express');
const router = express.Router();
const passport = require('passport');

const UserController = require('../../controllers/user.controller');

router.get('/onlineusers', UserController.getOnlineUsers);
router.get('/:userId', passport.authenticate('jwt', { session: false }), UserController.getUser);

module.exports = router;
