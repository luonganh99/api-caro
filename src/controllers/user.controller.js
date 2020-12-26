const bcrypt = require('bcryptjs');

const UserModel = require('../models/user.model');

module.exports.getAllUsers = async (req, res) => {
  try {
    const listUsers = await UserModel.getAllUsers();

    listUsers.map((user) => {
      user.id = user.userId;
    });

    return res.status(200).json(
      // status: 'success',
      // data: listUsers,
      listUsers,
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
