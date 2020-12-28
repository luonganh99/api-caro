const { WIDTH, HEIGHT } = require('../config/boardSize.config');
const BoardModel = require('../models/board.model');
const getDateNow = require('../utils/getDateNow');

module.exports.createBoard = async (req, res) => {
  try {
    const hostname = req.user.username;
    const guestname = req.body.guestname;

    const boardId = await BoardModel.create({
      hostname,
      guestname,
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

// TODO: Update cup for host and guest
module.exports.updateBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const username = req.username;
    await BoardModel.update({ winner: username, status: 1, finishedAt: getDateNow() }, { boardId });

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
