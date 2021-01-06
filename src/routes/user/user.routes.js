const express = require('express');
const router = express.Router();

const UserController = require('../../controllers/user.controller');

router.get('/', UserController.getAllUsers);

router.get('/:userId', UserController.getUserById);

router.get('/get-by-username/:username', UserController.getUserByUsername);

router.patch('/patch', UserController.patchUserInfo);
module.exports = router;
