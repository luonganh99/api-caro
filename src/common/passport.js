const passport = require('passport');
const { facebookAuth, googleAuth } = require('../config/auth.config');
const FacebookTokenStrategy = require('passport-facebook-token');
var GoogleTokenStrategy = require('passport-google-token').Strategy;

const UserModel = require('../models/user.model');

module.exports = () => {
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
};
