const express = require('express');
const router = express.Router();

const rangeMdw = require('../../middlewares/range.mdw');
const userController = require('../../controllers/user.controller');

router.get('/', rangeMdw, userController.getAllUsers);
router.delete('/:userId', rangeMdw, userController.deleteUser);

module.exports = router;
