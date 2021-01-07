const { facebookAuth, googleAuth } = require('../config/auth.config');
const FacebookTokenStrategy = require('passport-facebook-token');
var GoogleTokenStrategy = require('passport-google-token').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const UserModel = require('../models/user.model');
const getDateNow = require('../utils/getDateNow');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET_TOKEN,
};

module.exports = (passport) => {
  passport.use(
    new FacebookTokenStrategy(
      {
        clientID: facebookAuth.clientID,
        clientSecret: facebookAuth.clientSecret,
      },
      async function (accessToken, refreshToken, profile, done) {
        try {
          const userInfo = {
            externalId: profile.id,
            username: profile.emails[0].value,
            email: profile.emails[0].value,
            fullname: profile.displayName,
            avatar: profile.photos[0].value,
            createdAt: getDateNow(),
            status: 1,
          };
          let user = await UserModel.findByExternalId(userInfo.externalId);
          if (!user) {
            await UserModel.create(userInfo);
            user = await UserModel.findByExternalId(userInfo.externalId);
          }
          return done(null, user);
        } catch (error) {
          console.log(error);
          return done(error);
        }
      },
    ),
  );

  passport.use(
    new GoogleTokenStrategy(
      {
        clientID: googleAuth.clientID,
        clientSecret: googleAuth.clientSecret,
      },
      async function (accessToken, refreshToken, profile, done) {
        try {
          const userInfo = {
            externalId: profile.id,
            username: profile.emails[0].value,
            email: profile.emails[0].value,
            fullname: profile.displayName,
            avatar: profile._json.picture,
            createdAt: getDateNow(),
            status: 1,
          };
          let user = await UserModel.findByExternalId(userInfo.externalId);
          if (!user) {
            await UserModel.create(userInfo);
            user = await UserModel.findByExternalId(userInfo.externalId);
          }
          return done(null, user);
        } catch (error) {
          console.log(error);
          return done(error);
        }
      },
    ),
  );

  passport.use(
    new JwtStrategy(options, async (payload, done) => {
      try {
        const user = await UserModel.findById(payload.userId);
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      } catch (error) {
        done(error, null);
      }
    }),
  );
};
