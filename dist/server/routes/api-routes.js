'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _jwtConfig = require('../jwt-config');

var _jwtConfig2 = _interopRequireDefault(_jwtConfig);

var _xmljson = require('xmljson');

var _xmljson2 = _interopRequireDefault(_xmljson);

var _uuidV = require('uuid-v4');

var _uuidV2 = _interopRequireDefault(_uuidV);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _users = require('../models/users');

var _users2 = _interopRequireDefault(_users);

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// dotenv for development


_dotenv2.default.config({ silent: true });

var MongoClient = _mongodb2.default.MongoClient;
var MONGO_HOST = process.env.MONGO_HOST;

var app = module.exports = _express2.default.Router();

app.get('/get-all-books', function (req, res) {
	MongoClient.connect(MONGO_HOST, function (err, db) {
		_assert2.default.equal(null, err);
		db.collection('users').find().toArray(function (err, collection) {
			var books = collection.map(function (user) {
				return user.userData.userBooks;
			});
			res.status(201).send(books);
			db.close();
		});
	});
});

// handles user add books to their account
app.post('/add-book', function (req, res) {
	var _req$body = req.body,
	    title = _req$body.title,
	    userID = _req$body.userID,
	    token = _req$body.token;
	// verify user is authenticated

	_jsonwebtoken2.default.verify(token, _jwtConfig2.default, function (err, decoded) {
		if (!err) {
			// call Goodreads API to retrieve book data from user query
			_axios2.default.get('https://www.goodreads.com/search/index.xml?key=' + process.env.GOODREADS_KEY + '&q=' + title).then(function (response) {
				var result = response.data;
				// convert response to JSON
				_xmljson2.default.to_json(result, function (err, data) {
					if (!err) {
						(function () {
							// parse response data into a better object to return to client
							var bookData = data.GoodreadsResponse.search.results.work[0].best_book;
							var book = {
								id: bookData.id,
								title: bookData.title,
								author: bookData.author.name,
								image: bookData.image_url,
								smallImage: bookData.small_image_url,
								owner: userID
							};
							// find user in database and update them with the new book
							_users2.default.findOne({ id: userID }, function (err, user) {
								if (err) throw err;else if (user) {
									var books = [].concat(_toConsumableArray(user.userData.userBooks), [book]);
									user.userData.userBooks = books;
									user.save(function (err) {
										if (err) throw err;
										// update client by returning user
										else {
												res.status(201).send(user.userData);
											}
									});
								}
							});
						})();
					}
				});
			}).catch(function (err) {
				return console.log(err);
			});
		} else {
			res.status(401).send('You are not authorized!');
		}
	});
});

app.post('/remove-book', function (req, res) {
	var _req$body2 = req.body,
	    bookID = _req$body2.bookID,
	    userID = _req$body2.userID,
	    token = _req$body2.token;


	_jsonwebtoken2.default.verify(token, _jwtConfig2.default, function (err, decoded) {
		if (err) {
			res.status(401).send('You are not authorized!');
		} else {
			_users2.default.findOne({ id: userID }, function (err, user) {
				if (err) throw err;else if (user) {
					var books = user.userData.userBooks;
					var newBooks = books.filter(function (book) {
						return book.id !== bookID;
					});
					user.userData.userBooks = newBooks;
					user.save(function (err) {
						res.status(201).send(user);
					});
				}
			});
		}
	});
});

// handles user updating location and full name
app.post('/update-user-info', function (req, res) {
	var _req$body3 = req.body,
	    userID = _req$body3.userID,
	    fullName = _req$body3.fullName,
	    location = _req$body3.location,
	    token = _req$body3.token;

	_jsonwebtoken2.default.verify(token, _jwtConfig2.default, function (err, decoded) {
		if (err) {
			res.status(401).send('You are not a valid user!');
		} else {
			_users2.default.findOne({ id: userID }, function (err, user) {
				if (err) return done(err);else if (user) {
					user.userData.fullName = fullName;
					user.userData.location = location;
					user.save(function (err) {
						if (err) return done(err);else {
							res.status(201).send(user.userData);
						}
					});
				}
			});
		}
	});
});

app.post('/request-trade', function (req, res) {
	var _req$body4 = req.body,
	    offeredBook = _req$body4.offeredBook,
	    offerOwner = _req$body4.offerOwner,
	    requestedBook = _req$body4.requestedBook,
	    acceptingOwner = _req$body4.acceptingOwner,
	    token = _req$body4.token;


	_jsonwebtoken2.default.verify(token, _jwtConfig2.default, function (err, decoded) {
		if (err) {
			res.status(401).send('You are unauthorized!');
		} else {
			// update pending requests of current user
			_users2.default.findOne({ id: offerOwner }, function (err, user) {
				if (err) throw err;else if (user) {
					var currPending = user.userData.pendingRequests;
					var newPending = [].concat(_toConsumableArray(currPending), [{
						requestedBook: requestedBook,
						acceptingOwner: acceptingOwner,
						offeredBook: offeredBook
					}]);
					user.userData.pendingRequests = newPending;
					user.save(function (err) {
						if (err) throw err;
						res.status(201).send({ user: user });
					});
				}
			}).then(function () {
				// update user data of recipient user
				_users2.default.findOne({ id: acceptingOwner }, function (err, user) {
					if (err) throw err;else if (user) {
						// set trade information to store for recipient
						var currRequests = user.userData.receivedRequests;
						var newRequests = [].concat(_toConsumableArray(currRequests), [{
							requestedBook: requestedBook,
							offerOwner: offerOwner,
							offeredBook: offeredBook
						}]);
						user.userData.receivedRequests = newRequests;
						user.save(function (err) {
							if (err) throw err;
						});
					}
				});
			});
		}
	});
});

app.post('/accept-trade', function (req, res) {
	var _req$body5 = req.body,
	    offeredBook = _req$body5.offeredBook,
	    requestedBook = _req$body5.requestedBook,
	    offerOwner = _req$body5.offerOwner,
	    acceptingOwner = _req$body5.acceptingOwner,
	    token = _req$body5.token;

	offeredBook.owner = acceptingOwner;
	requestedBook.owner = offerOwner;
	_jsonwebtoken2.default.verify(token, _jwtConfig2.default, function (err, decoded) {
		if (err) {
			res.status(401).send('You are not authorized!');
		} else {
			// Update user data for both sides of the trade
			_users2.default.findOne({ id: offerOwner }, function (err, user) {
				if (err) throw err;else if (user) {
					// update requesting user's book list
					var books = user.userData.userBooks;
					var filteredBooks = books.filter(function (book) {
						return book.id !== offeredBook.id;
					});
					var updatedBooks = [].concat(_toConsumableArray(filteredBooks), [requestedBook]);
					user.userData.userBooks = updatedBooks;
					// update requesting user's pending requests
					var currPending = user.userData.pendingRequests;
					var newPending = currPending.filter(function (request) {
						return request.requestedBook.id !== requestedBook.id;
					});
					user.userData.pendingRequests = newPending;
					// create a notification for the trade confirmation
					var notification = {
						id: (0, _uuidV2.default)(),
						msg: acceptingOwner + ' accepted your request for ' + requestedBook.title + '! It\'s now in your collection!'
					};
					var notificationsUpdate = user.userData.notifications.slice();
					notificationsUpdate.push(notification);
					user.userData.notifications = notificationsUpdate;
					// save user updates
					user.save(function (err) {
						if (err) throw err;
					});
				}
			}).then(function () {
				_users2.default.findOne({ id: acceptingOwner }, function (err, user) {
					if (err) throw err;else if (user) {
						// update accepting user's book list
						var books = user.userData.userBooks;
						var filteredBooks = books.filter(function (book) {
							return book.id !== requestedBook.id;
						});
						var updatedBooks = [].concat(_toConsumableArray(filteredBooks), [offeredBook]);
						user.userData.userBooks = updatedBooks;
						// update accepting user's received requests
						var currRequests = user.userData.receivedRequests;
						var updatedRequests = currRequests.filter(function (request) {
							return request.requestedBook.id !== requestedBook.id;
						});
						user.userData.receivedRequests = updatedRequests;
						// save user updates
						user.save(function (err) {
							if (err) throw err;
							res.status(201).send({ user: user });
						});
					}
				});
			}).catch(function (err) {
				return console.log(err);
			});
		}
	});
});

app.post('/decline-trade', function (req, res) {
	var _req$body6 = req.body,
	    offeredBook = _req$body6.offeredBook,
	    offerOwner = _req$body6.offerOwner,
	    requestedBook = _req$body6.requestedBook,
	    acceptingOwner = _req$body6.acceptingOwner,
	    token = _req$body6.token;

	_jsonwebtoken2.default.verify(token, _jwtConfig2.default, function (err, decoded) {
		if (err) {
			res.status(401).send('You are not authorized!');
		} else {
			// for offer owner, remove pending request
			_users2.default.findOne({ id: offerOwner }, function (err, user) {
				if (err) throw err;else if (user) {
					var currPending = user.userData.pendingRequests;
					var newPending = currPending.filter(function (request) {
						return request.requestedBook.id !== requestedBook.id;
					});
					user.userData.pendingRequests = newPending;

					// create a notification for the trade rejection
					var notification = {
						id: (0, _uuidV2.default)(),
						msg: acceptingOwner + ' rejected your request for ' + requestedBook.title + '! Too bad!'
					};
					var notificationsUpdate = user.userData.notifications.slice();
					notificationsUpdate.push(notification);
					user.userData.notifications = notificationsUpdate;

					user.save(function (err) {
						if (err) throw err;
					});
				}
			}).then(function () {
				// for accepting owner, remove received request
				_users2.default.findOne({ id: acceptingOwner }, function (err, user) {
					if (err) throw err;else if (user) {
						var currRequests = user.userData.receivedRequests;
						var newRequests = currRequests.filter(function (request) {
							return request.requestedBook.id !== requestedBook.id;
						});
						user.userData.receivedRequests = newRequests;
						user.save(function (err) {
							if (err) throw err;
							res.status(201).send(user);
						});
					}
				}).catch(function (err) {
					return console.log(err);
				});
			});
		}
	});
});

app.post('/remove-notification', function (req, res) {
	var _req$body7 = req.body,
	    token = _req$body7.token,
	    notificationID = _req$body7.notificationID,
	    userID = _req$body7.userID;


	_jsonwebtoken2.default.verify(token, _jwtConfig2.default, function (err, decoded) {
		if (err) {
			res.status(401).send('You are not authorized!');
		} else {

			// find user
			_users2.default.findOne({ id: userID }, function (err, user) {
				if (err) throw err;else if (user) {
					// update notifcations, removing the selected one
					var notifications = user.userData.notifications;

					var newNotifications = notifications.filter(function (notification) {
						return notification.id !== notificationID;
					});
					user.userData.notifications = newNotifications;
					user.save(function (err) {
						if (err) throw err;
						// return updated user data to client
						res.status(201).send(user.userData);;
					});
				}
			});
		}
	});
});