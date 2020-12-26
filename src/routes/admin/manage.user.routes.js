const express = require('express');
const router = express.Router();

const rangeMdw = require('../../middlewares/range.mdw');
const userController = require('../../controllers/user.controller');

router.get('/', rangeMdw, userController.getAllUsers);

module.exports = router;
