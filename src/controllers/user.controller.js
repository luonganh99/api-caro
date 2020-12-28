const UserModel = require('../models/user.model');

module.exports.getOnlineUsers = (req, res) => {
  res.send('online users');
};

module.exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findById(userId);

    res.status(200).json({
      status: 'success',
      data: {
        userInfo: user,
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
