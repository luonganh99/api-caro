const { WIDTH, HEIGHT } = require('../config/boardSize.config');
const BoardModel = require('../models/board.model');
const getDateNow = require('../utils/getDateNow');

module.exports.createBoard = async (req, res) => {
  try {
    const hostname = req.user.username;
    const guestname = req.body.guestname;

    let battleArray = '';
    for (let i = 0; i < WIDTH; i++) {
      for (let j = 0; j < HEIGHT; j++) {
        battleArray += '0';
      }
    }

    console.log({
      hostname,
      guestname,
      battleArray,
      createdAt: getDateNow(),
    });

    const boardId = await BoardModel.create({
      hostname,
      guestname,
      battleArray,
      createdAt: getDateNow(),
    });

    res.status(200).json({
      status: 'success',
      data: {
        boardId,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

module.exports.getBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await BoardModel.findById(boardId);
    res.status(200).json({
      status: 'success',
      data: {
        boardInfo: board,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

module.exports.updateBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const userId = req.userId;
    await BoardModel.update({ winner: userId, status: 1 }, { boardId });

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Update board successfully',
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};

module.exports.getAllBoard = async (req, res) => {
  try {
    const username = req.user.username;
    const boards = await BoardModel.findByUsername(username);

    res.status(200).json({
      status: 'success',
      data: {
        boardList: boards,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 'error', message: error.message });
  }
};
