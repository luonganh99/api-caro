const passport = require('passport');

const express = require('express');
const router = express.Router();

const boardController = require('../../controllers/board.controller');

router.get('/', passport.authenticate('jwt', { session: false }), boardController.getAllBoard);
router.post('/', passport.authenticate('jwt', { session: false }), boardController.createBoard);
router.get('/:boardId', passport.authenticate('jwt', { session: false }), boardController.getBoard);
router.patch(
  '/:boardId',
  passport.authenticate('jwt', { session: false }),
  boardController.updateBoard,
);

module.exports = router;
