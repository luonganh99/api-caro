const ChatModel = require('../models/chat.model');

module.exports.getChat = async (req, res) => {
  try {
    const { boardId } = req.query;

    const chat = await ChatModel.findByBoardId(boardId);

    res.status(200).json({
      status: 'success',
      data: {
        chat,
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
