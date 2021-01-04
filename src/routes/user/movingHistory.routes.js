const express = require('express');
const router = express.Router();

const movingHistoryController = require('../../controllers/movingHistory.controller');

router.get('/', movingHistoryController.getMovingHistory);

module.exports = router;
