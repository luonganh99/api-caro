const bcrypt = require('bcryptjs');

const UserModel = require('../models/user.model');
const createToken = require('../utils/createToken');

module.exports.userLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Authentication is incorrect',
        errors: {
          username: !username && 'Username is required',
          password: !password && 'Password is required',
        },
      });
    }

    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Authentication is incorrect',
        errors: {
          username: 'Username is incorrect',
        },
      });
    }

    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.status(400).json({
        status: 'error',
        message: 'Authentication is incorrect',
        errors: {
          password: 'Password is incorrect',
        },
      });
    }

    delete user.password;
    const token = createToken(user);

    res.status(200).json({
      status: 'success',
      data: {
        token,
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

module.exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await UserModel.findByUsername(username);
    // Check authorization
    if (!user || user.role !== 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Authentication is incorrect',
        errors: {
          username: 'Username is incorrect',
        },
      });
    }

    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.status(400).json({
        status: 'error',
        message: 'Authentication is incorrect',
        errors: {
          password: 'Password is incorrect',
        },
      });
    }

    const token = createToken(user.userId);

    delete user.password;

    res.status(200).json({
      status: 'success',
      data: {
        token,
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

module.exports.signup = async (req, res) => {
  try {
    const { username, password, fullname, email } = req.body;
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);

    await UserModel.create({
      username,
      password: hashPassword,
      fullname,
      email,
    });

    res.status(200).json({
      status: 'success',
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports.google = async (req, res) => {
  if (req.user) {
    const token = createToken(req.user.userId);
    res.status(200).json({ status: 'success', data: { token, userInfo: req.user } });
  } else {
    res.status(400).json({ status: 'error', message: req.error });
  }
};

module.exports.facebook = async (req, res) => {
  if (req.user) {
    const token = createToken(req.user.userId);
    res.status(200).json({ status: 'success', data: { token, userInfo: req.user } });
  } else {
    res.status(400).json({ status: 'error', message: req.error });
  }
};
