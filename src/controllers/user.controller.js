const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const boardModel = require('../models/board.model');

const UserModel = require('../models/user.model');

module.exports.getAllUsers = async (req, res) => {
  let searchText;
  if (Object.keys(req.query).length !== 0) {
    searchText = JSON.parse(req.query.filter).searchText;
  }

  try {
    // const listUsers = await UserModel.getAllUsers();
    let listUsers = [];

    if (searchText && searchText.trim().length > 0) {
      listUsers = await UserModel.findBySearchText(searchText);
    } else {
      listUsers = await UserModel.getAllUsers();
    }

    listUsers.forEach((user) => {
      user.id = user.userId;
    });

    return res.status(200).json(listUsers);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
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
    delete user.password;

    if (user) {
      user.id = Number(userId);
      return res.status(200).json(user);
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await UserModel.findByUsername(username);
    delete user.password;

    if (user) {
      return res.status(200).json({
        status: 'success',
        data: {
          userInfo: {
            avatar: user.avatar,
            cups: user.cups,
          },
        },
      });
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
    reqData.createdAt = dayjs(reqData.createdAt).format('YYYY-MM-DD HH:mm:ss');

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

// react admin request with filter
module.exports.getUsers = async (req, res) => {
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

module.exports.getAllPlayedBoards = async (req, res) => {
  const { userId } = req.params;

  try {
    const listGames = await boardModel.findByIdUserId(userId);

    return res.status(200).json({
      status: 'success',
      data: listGames,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
