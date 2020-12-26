const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserModel = require('../models/user.model');
const createToken = require('../utils/createToken');
const sendEmail = require('../common/email');
const getDateNow = require('../utils/getDateNow');

// Auth
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
    const token = createToken(user, 60 * 60 * 24);

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

    const userId = await UserModel.create({
      username,
      password: hashPassword,
      fullname,
      email,
      createdAt: getDateNow(),
    });

    // TODO: Send email to activate
    const hashToken = createToken({ userId }, 60 * 60);
    const subject = 'Activate your account at Caro Online';
    const html = `<a href="${process.env.CLIENT_URL}/verify-account/${hashToken}">Activate</a>`;
    sendEmail(email, subject, html);

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

module.exports.verifyAccount = (req, res) => {
  const { hashToken } = req.params;
  jwt.verify(hashToken, process.env.SECRET_TOKEN, async (err, decodedToken) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Token',
      });
    }

    try {
      await UserModel.patch({ status: 1 }, { userId: decodedToken.userId });

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Activate successfully',
        },
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  });
};

module.exports.sendEmailVerify = (req, res) => {
  const hashToken = createToken({ userId: req.user.userId }, 60 * 60);
  const subject = 'Activate your account at Caro Online';
  const html = `<a href="${process.env.CLIENT_URL}/verify-account/${hashToken}">Activate</a>`;

  sendEmail(req.user.email, subject, html);
};

module.exports.sendEmailForgot = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findByEmail(email);

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is incorrect',
      });
    }

    const hashToken = createToken({ userId: user.userId }, 60 * 60);
    const subject = 'Change your password at Caro Online';
    const html = `<a href="${process.env.CLIENT_URL}/reset-password/${hashToken}">Reset yout password</a>`;
    sendEmail(email, subject, html);

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Successfully',
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

module.exports.resetPassword = (req, res) => {
  const { hashToken, password } = req.body;

  jwt.verify(hashToken, process.env.SECRET_TOKEN, async (err, decodedToken) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Token',
      });
    }

    try {
      const salt = await bcrypt.genSalt();
      const hashPassword = await bcrypt.hash(password, salt);
      await UserModel.patch({ password: hashPassword }, { userId: decodedToken.userId });

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Change password successfully',
        },
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
  });
};
