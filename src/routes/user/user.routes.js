const express = require('express');
const router = express.Router();

const UserController = require('../../controllers/user.controller');

router.get('/onlineusers', UserController.getOnlineUsers);

module.exports = router;
