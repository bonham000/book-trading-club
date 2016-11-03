'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _jwtConfig = require('../jwt-config');

var _jwtConfig2 = _interopRequireDefault(_jwtConfig);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _validateUser = require('../shared/validateUser');

var _validateUser2 = _interopRequireDefault(_validateUser);

var _uuidV = require('uuid-v4');

var _uuidV2 = _interopRequireDefault(_uuidV);

var _users = require('../models/users');

var _users2 = _interopRequireDefault(_users);

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var url = process.env.MONGO_HOST;

var MongoClient = _mongodb2.default.MongoClient;

var app = module.exports = _express2.default.Router();

// create a jwt token for authenticated users
function createToken(username) {
  return _jsonwebtoken2.default.sign({ user: username }, _jwtConfig2.default, { expiresIn: 60 * 60 });
}

// handle new user registration
app.post('/register', function (req, res) {
  var userInfo = req.body;
  console.log('New registration received on server:', userInfo);
  var validation = (0, _validateUser2.default)(userInfo);
  // Check if the user submitted all the fields correctly
  if (validation.isValid) {
    _users2.default.findOne({
      id: userInfo.email
    }, function (err, user) {
      if (err) {
        return done(err);
      }
      // if there is no user with this email as id, create a new one
      if (!user) {
        var passwordDigest = _bcrypt2.default.hashSync(userInfo.password, 10);
        user = new _users2.default({
          id: userInfo.email,
          displayName: userInfo.username,
          username: userInfo.username,
          password: passwordDigest,
          githubId: '',
          twitterId: '',
          userData: {
            userID: userInfo.email,
            username: userInfo.username,
            fullName: '',
            location: '',
            userBooks: [],
            pendingRequests: [],
            receivedRequests: [],
            notifications: []
          }
        });
        user.save(function (err) {
          if (err) console.log(err);
          res.status(201).send({
            username: userInfo.username,
            id_token: createToken(userInfo.username),
            userData: user.userData
          });
        });
        // in this case the user with this email as id signed in previously with GitHub
        // update the same account
      } else if (user.password === '') {
        var _passwordDigest = _bcrypt2.default.hashSync(user.password, 10);
        user.password = _passwordDigest;
        user.save(function (err) {
          if (err) console.log(err);
          res.status(201).send({
            username: user.username,
            userData: user.userData,
            id_token: createToken(user.username)
          });
        });
        // if user exists with this id, prevent new registration
      } else {
        console.log('user,', user);
        res.status(401).send('This email is already registered.');
      }
    });
  } else {
    console.log('Invalid Registration:', validation.errors);
    res.status(400).send('Registration was in valid:', validation.errors);
  }
});

// handle user login
app.post('/sessions/create', function (req, res) {
  var _req$body = req.body,
      email = _req$body.email,
      password = _req$body.password;


  _users2.default.findOne({ id: email }, function (err, user) {
    if (err) throw err;else if (user) {
      if (_bcrypt2.default.compareSync(password, user.password)) {
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
                    msg: email + ' no longer owns ' + offer.offeredBook.title + ' which they offered to trade you, so the trade has been removed.'
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
          // update recevied requests for user for them to see updated information upon login
          user.userData.receivedRequests = newRequests;
          user.save(function (err) {
            if (err) throw err;
          });
          // remove pending request from offer owner as well

          res.status(201).send({
            id_token: createToken(user.username),
            username: user.username,
            userData: user.userData
          });
        })();
      } else {
        res.status(401).send('Invalied credentials!');
      }
    } else {
      res.status(404).send('There is no user with this email!');
    }
  });
});