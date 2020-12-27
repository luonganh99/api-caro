const UserModel = require('../models/user.model');

module.exports.getOnlineUsers = (req, res) => {
  res.send('online users');
};

module.exports.patchUserInfo = async (req, res) => {
  try {
    const cups = req.body.cups;
    const total = req.body.total;
    const wins = req.body.wins;
    console.log(wins);
    const userId = req.user.userId;
    await UserModel.patch({ cups, wins, total }, { userId });

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Update User Info Successfully',
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};
