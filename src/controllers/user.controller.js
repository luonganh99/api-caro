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

module.exports.getOnlineUsers = (req, res) => {
  res.send('online users');
};

module.exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  console.log('DEL userID: ', userId);

  try {
    const delRes = await UserModel.delete(userId);

    if (delRes) {
      return res.status(200).json({ status: 'success' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId);
    user.id = Number(userId);

    if (user) {
      return res.status(200).json(user);
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reqData = req.body;

    delete reqData.id; // react-admin

    console.log('update user req data: ', reqData);

    const result = await UserModel.patch(reqData, { userId: Number(userId) });

    if (result) {
      return res.status(200).json({ id: Number(userId) });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// module.exports.createUser = async (req, res) => {
//   const { id, username, password } = req.body;
//   console.log('DEL userID: ', userId);

//   try {
//     const delRes = await UserModel.delete(userId);

//     if (delRes) {
//       return res.status(200).json({ status: 'success' });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       status: 'error',
//       message: error.message,
//     });
//   }
// };
