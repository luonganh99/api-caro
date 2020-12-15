const express = require('express');
const router = express.Router();

const boardController = require('../../controllers/board.controller');
const { authenticateToken } = require('../../middlewares/auth.mdw');

router.get('/', authenticateToken, boardController.getAllBoard);
router.post('/', authenticateToken, boardController.createBoard);
router.get('/:boardId', authenticateToken, boardController.getBoard);
router.patch('/:boardId', authenticateToken, boardController.updateBoard);

module.exports = router;
