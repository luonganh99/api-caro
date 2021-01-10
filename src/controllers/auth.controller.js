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
    console.log('LOGINNNNNN ', username, password);

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

    if (user.status === 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Authentication is incorrect',
        errors: {
          username: 'Your account is banned',
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
      return res.status(401).json({
        status: 'error',
        message: 'Authentication is incorrect',
        errors: {
          password: 'Password is incorrect',
        },
      });
    }

    const token = createToken(user, 60 * 60 * 24);
    console.log(user);
    delete user.password;

    res.status(200).json({
      status: 'success',
      data: {
        token,
        adminInfo: user,
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

    const avatarList = [
      'https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/batman_hero_avatar_comics-512.png',
      'https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/anime_spirited_away_no_face_nobody-512.png',
      'https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/trump_president_avatar_male-512.png',
      'https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/pilot_traveller_person_avatar-512.png',
      'https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/scientist_einstein_avatar_professor-512.png',
      'https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/indian_man_turban_sikh-512.png',
      'https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/sheep_mutton_animal_avatar-512.png',
    ];

    const userId = await UserModel.create({
      username,
      password: hashPassword,
      fullname,
      email,
      createdAt: getDateNow(),
      avatar: avatarList[Math.floor(Math.random() * 7)],
    });

    // TODO: Send email to activate
    const hashToken = createToken({ userId }, 60 * 60);
    const subject = 'Activate your account at Caro Online';
    const html = `<div><p>Click to <a href="${process.env.CLIENT_URL}/verify-account/${hashToken}">this to activate</a> your account</div>`;
    sendEmail(email, subject, html);

    res.status(200).json({
      status: 'success',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      let errors = {};

      if (error.sqlMessage.includes('username')) {
        errors.username = 'This username is used. Please try another name!';
      }

      if (error.sqlMessage.includes('email')) {
        errors.email = 'This email is used. Please try another email!';
      }

      return res.status(400).json({
        status: 'error',
        message: 'Invalid signup',
        errors,
      });
    }

    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

module.exports.google = async (req, res) => {
  if (req.user) {
    if (req.user.status === 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Authentication is incorrect',
        errors: {
          username: 'Your account is banned',
        },
      });
    }
    const token = createToken(req.user, 60 * 60 * 24);
    res.status(200).json({ status: 'success', data: { token, userInfo: req.user } });
  } else {
    res.status(400).json({ status: 'error', message: req.error });
  }
};

module.exports.facebook = async (req, res) => {
  if (req.user) {
    if (req.user.status === 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Authentication is incorrect',
        errors: {
          username: 'Your account is banned',
        },
      });
    }
    const token = createToken(req.user, 60 * 60 * 24);
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
  const html = `<div><p>Click to <a href="${process.env.CLIENT_URL}/verify-account/${hashToken}">this to activate</a> your account</div>`;

  sendEmail(req.user.email, subject, html);

  return res.status(200).json({
    status: 'success',
  });
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
