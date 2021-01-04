const MovingHistoryModel = require('../models/movingHistory.model');

module.exports.getMovingHistory = async (req, res) => {
  try {
    const { boardId } = req.query;

    const movingHistory = await MovingHistoryModel.findByBoardId(boardId);

    res.status(200).json({
      status: 'success',
      data: {
        historyList: movingHistory,
      },
    });

    console.log(boardId);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
