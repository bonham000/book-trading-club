'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passportGithub = require('passport-github2');

var _passportGithub2 = _interopRequireDefault(_passportGithub);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _jwtConfig = require('../jwt-config');

var _jwtConfig2 = _interopRequireDefault(_jwtConfig);

var _uuidV = require('uuid-v4');

var _uuidV2 = _interopRequireDefault(_uuidV);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _users = require('../models/users');

var _users2 = _interopRequireDefault(_users);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_dotenv2.default.config({ silent: true });

// dotenv for development


var app = module.exports = _express2.default.Router();

function createToken(username) {
  return _jsonwebtoken2.default.sign({ user: username }, _jwtConfig2.default, { expiresIn: 60 * 60 });
}

// define GitHub strategy
_passport2.default.use(new _passportGithub2.default({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL_PROD
}, function (accessToken, refreshToken, profile, done) {
  // search for user in database base on id = GitHub email address as unique identification
  _users2.default.findOne({ githubId: profile.id }, function (err, user) {
    // handle error
    if (err) {
      return done(err);
    }
    // if there is no user with this email, create a new one
    if (!user) {
      user = new _users2.default({
        id: profile.username,
        displayName: profile.displayName,
        username: profile.username,
        password: '',
        githubId: profile.id,
        userData: {
          userID: profile.id,
          username: profile.username,
          fullName: profile.displayName,
          location: '',
          userBooks: [],
          pendingRequests: [],
          receivedRequests: [],
          notifications: []
        }
      });
      user.save(function (err) {
        if (err) console.log(err);
        return done(err, user);
      });
    } else {
      console.log('user,', user);
      return done(err, user);
    }
  });
}));

// request for GitHub authentication
app.get('/auth/github', _passport2.default.authenticate('github'));

// GitHub callback
app.get('/auth/github/callback', _passport2.default.authenticate('github', { failureRedirect: '/login' }), function (req, res) {
  // Successful authentication, redirect to for client to continue auth process
  res.redirect('/account');
});

// client verifies auth flow from passport redirect are receives jwt token in response or redirects to login page otherwise
app.post('/verify', function (req, res) {

  // if user is authenticated find them in the database to return
  // their user data and send them a jwt token for client authentication
  if (req.isAuthenticated()) {

    _users2.default.findOne({ id: req.user.id }, function (err, user) {

      if (err) return done(err);else if (user) {
        (function () {

          // this check is executed whenever a user logs in either directly (here) or through passport

          // this block of code checks the user's data for received and pending requests for books it no longer owns
          // if a book is found, the received request is removed, and then the pending request for the
          // offer owner of that request is found and removed as well, conversely, if there is a pending request
          // with an offer book the user no longer owns, the request is removed for both users

          // handle pending requests
          var testPendingRequests = function testPendingRequests(books, offer) {
            var testBooks = books.filter(function (book) {
              return book.id === offer.offeredBook.id;
            });
            if (testBooks.length > 0) {
              return true;
            } else {
              var acceptingOwner = offer.acceptingOwner;
              // find offer owner in database and remove pending offered from their data
              _users2.default.findOne({ id: acceptingOwner }, function (err, user) {
                if (err) throw err;else if (user) {
                  var _receivedRequests = user.userData.receivedRequests;

                  var _newRequests = _receivedRequests.filter(function (receivedRequest) {
                    return receivedRequest.requestedBook.id !== offer.requestedBook.id;
                  });
                  // update pending requests of offer owner
                  user.userData.receivedRequests = _newRequests;

                  var notification = {
                    id: (0, _uuidV2.default)(),
                    msg: offer.offerOwner + ' no longer owns ' + offer.offeredBook.title + ' which they offered to trade you, so the trade has been removed.'
                  };
                  var notificationsUpdate = user.userData.notifications.slice();
                  notificationsUpdate.push(notification);
                  user.userData.notifications = notificationsUpdate;

                  user.save(function (err) {
                    if (err) throw err;
                  });
                }
              });
              return false;
            }
          };

          // handle received requests
          var testReceivedRequests = function testReceivedRequests(books, request) {
            var testBooks = books.filter(function (book) {
              return book.id === request.requestedBook.id;
            });
            if (testBooks.length > 0) {
              return true;
            } else {
              var offerOwner = request.offeredBook.owner;
              // find offer owner in database and remove pending request from their data
              _users2.default.findOne({ id: offerOwner }, function (err, user) {
                if (err) throw err;else if (user) {
                  var _pendingRequests = user.userData.pendingRequests;

                  var _newPending = _pendingRequests.filter(function (pendingRequest) {
                    return pendingRequest.requestedBook.id !== request.requestedBook.id;
                  });
                  // update pending requests of offer owner
                  user.userData.pendingRequests = _newPending;

                  var notification = {
                    id: (0, _uuidV2.default)(),
                    msg: request.offeredBook.owner + ' no longer owns ' + request.offeredBook.title + ' which they offered to trade you, so the trade has been removed.'
                  };
                  var notificationsUpdate = user.userData.notifications.slice();
                  notificationsUpdate.push(notification);
                  user.userData.notifications = notificationsUpdate;

                  user.save(function (err) {
                    if (err) throw err;
                  });
                }
              });
              return false;
            }
          };

          // check received requests for any books user no longer has and remove these requests from their data
          var _user$userData = user.userData,
              userBooks = _user$userData.userBooks,
              receivedRequests = _user$userData.receivedRequests,
              pendingRequests = _user$userData.pendingRequests;


          var newPending = pendingRequests.filter(function (request) {
            return testPendingRequests(userBooks, request);
          });
          user.userData.pendingRequests = newPending;

          var newRequests = receivedRequests.filter(function (request) {
            return testReceivedRequests(userBooks, request);
          });
          // update received requests for user for them to see updated information upon login
          user.userData.receivedRequests = newRequests;
          user.save(function (err) {
            if (err) throw err;
          });
          // remove pending request from offer owner as well

          res.status(201).send({
            id_token: createToken(req.user.username),
            user: req.user.username,
            userData: user.userData
          });
        })();
      }
    });
    // if session is not authenticated redirect to login
  } else {
    res.redirect('/login');
  }
});

// handle logout in passport
app.get('/logout-passport', function (req, res) {
  req.logout();
});