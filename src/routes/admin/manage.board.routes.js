const express = require('express');
const router = express.Router();

const rangeMdw = require('../../middlewares/range.mdw');
const boardController = require('../../controllers/board.controller');

router.get('/', rangeMdw, boardController.getBoards);
router.get('/:boardId', boardController.getBoardById);
router.get('/:boardId/chats', boardController.getChatsInBoard);

module.exports = router;
