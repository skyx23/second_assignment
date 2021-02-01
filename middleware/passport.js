const LocalStratergy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../schema/clients');

module.exports = function (passport) {
  passport.use(
    new LocalStratergy(
      { usernameField: 'username', passwordField: 'password' },
      (username, password, done) => {
        User.findOne({ username: username })
          .then((user) => {
            if (!user) {
              return done(null, false, { message: 'username not found' });
            }
            bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) throw err;
              if (isMatch) {
                return done(null,user);
              } else {
                return done(null, false, { message: "password doesn't match" });
              }
            });
          })
          .catch((err) => console.log(err));
      }
    )
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });
};
