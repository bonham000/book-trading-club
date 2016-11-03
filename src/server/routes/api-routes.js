import express from 'express'
import axios from 'axios'
import assert from 'assert'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import secret from '../jwt-config'
import dotenv from 'dotenv'
dotenv.config();

import XMLConverter from 'xmljson'
import uuid from 'uuid-v4'

import User from '../models/users'

import mongodb from 'mongodb'
const MongoClient = mongodb.MongoClient;
const url = process.env.MONGO_HOST;

const app = module.exports = express.Router();

app.get('/get-all-books', (req, res) => {
	MongoClient.connect(url, (err, db) => {
		assert.equal(null, err)
		db.collection('users').find().toArray( (err, collection) => {
			const books = collection.map( (user) => {
				return user.userData.userBooks;
			});
			res.status(201).send(books);
			db.close();
		});
	});
});

// handles user add books to their account
app.post('/add-book', (req, res) => {
	const { title, userID, token } = req.body;
	// verify user is authenticated
	jwt.verify(token, secret, (err, decoded) => {
		if (!err) {
			// call Goodreads API to retrieve book data from user query
			axios.get(`https://www.goodreads.com/search/index.xml?key=${process.env.GOODREADS_KEY}&q=${title}`).then( (response) => {
				let result = response.data;
				// convert response to JSON
				XMLConverter.to_json(result, (err, data) => {
					if (!err) {
						// parse response data into a better object to return to client
						const bookData = data.GoodreadsResponse.search.results.work[0].best_book
						const book = {
							id: bookData.id,
							title: bookData.title,
							author: bookData.author.name,
							image: bookData.image_url,
							smallImage: bookData.small_image_url,
							owner: userID
						}
						// find user in database and update them with the new book
						User.findOne({ id: userID }, function(err, user) {
							if (err) throw err;
							else if (user) {
								let books = [...user.userData.userBooks, book]
								user.userData.userBooks = books;
								user.save(function(err) {
									if (err) throw err;
									// update client by returning user
									else { res.status(201).send(user.userData) }
								});
							}
						});
					}
				});
			}).catch(err => console.log(err));
		} else { res.status(401).send('You are not authorized!') }
	});
});

app.post('/remove-book', (req, res) => {
	const { bookID, userID, token } = req.body;

	jwt.verify(token, secret, (err, decoded) => {
		if (err) { res.status(401).send('You are not authorized!') }
		else {
			User.findOne({ id: userID }, function(err, user) {
				if (err) throw err;
				else if (user) {
					let books = user.userData.userBooks;
					let newBooks = books.filter( (book) => {
						return book.id !== bookID;
					});
					user.userData.userBooks = newBooks;
					user.save(function(err) {
						res.status(201).send(user);
					});
				}
			});
		}
	});

});

// handles user updating location and full name
app.post('/update-user-info', (req, res) => {
	const { userID, fullName, location, token } = req.body;
	jwt.verify(token, secret, (err, decoded) => {
		if (err) {
			res.status(401).send('You are not a valid user!');
		} else {
			User.findOne({id: userID}, function(err, user) {
				if (err) return done(err);
				else if (user) {
					user.userData.fullName = fullName;
					user.userData.location = location;
					user.save(function(err) {
						if (err) return done(err);
						else { res.status(201).send(user.userData) }
					});
				}
			});
		}
	});
});

app.post('/request-trade', (req, res) => {
	const { offeredBook, offerOwner, requestedBook, acceptingOwner, token } = req.body;

	jwt.verify(token, secret, (err, decoded) => {
		if (err) {
			res.status(401).send('You are unauthorized!');
		} else {
			// update pending requests of current user
			User.findOne({ id: offerOwner }, function(err, user) {
				if (err) throw err;
				else if (user) {
					let currPending = user.userData.pendingRequests;
					let newPending = [...currPending,
						{
							requestedBook,
							acceptingOwner,
							offeredBook
						}
					];
					user.userData.pendingRequests = newPending;
					user.save(function(err) {
						if (err) throw err;
						res.status(201).send({user});
					});
				}
			}).then( () => {
				// update user data of recipient user
				User.findOne({ id: acceptingOwner }, function(err, user) {
					if (err) throw err;
					else if (user) {
						// set trade information to store for recipient
						let currRequests = user.userData.receivedRequests;
						let newRequests = [...currRequests, 
							{
								requestedBook,
								offerOwner,
								offeredBook
							}
						];
						user.userData.receivedRequests = newRequests;
						user.save(function(err) {
							if (err) throw err;
						});
					}
				});
			});
		}
	});
});


app.post('/accept-trade', (req, res) => {
	let { offeredBook, requestedBook, offerOwner, acceptingOwner, token } = req.body;
	offeredBook.owner = acceptingOwner;
	requestedBook.owner = offerOwner;
	jwt.verify(token, secret, (err, decoded) => {
		if (err) {
			res.status(401).send('You are not authorized!');
		} else {
			// Update user data for both sides of the trade
			User.findOne({ id: offerOwner }, function(err, user) {
					if (err) throw err;
					else if (user) {
						// update requesting user's book list
						let books = user.userData.userBooks;
						let filteredBooks = books.filter( (book) => {
							return book.id !== offeredBook.id;
						});
						let updatedBooks = [...filteredBooks, requestedBook];
						user.userData.userBooks = updatedBooks;
						// update requesting user's pending requests
						let currPending = user.userData.pendingRequests;
						let newPending = currPending.filter( (request) => {
							return request.requestedBook.id !== requestedBook.id;
						});
						user.userData.pendingRequests = newPending;
						// create a notification for the trade confirmation
						const notification = {
							id: uuid(),
							msg: `${acceptingOwner} accepted your request for ${requestedBook.title}! It's now in your collection!`
						}
						let notificationsUpdate = user.userData.notifications.slice();
						notificationsUpdate.push(notification);
						user.userData.notifications = notificationsUpdate;
						// save user updates
						user.save(function(err) {if (err) throw err; });
					}
				}).then( () => {
			User.findOne({ id: acceptingOwner }, function(err, user) {
				if (err) throw err;
				else if (user) {
					// update accepting user's book list
					let books = user.userData.userBooks;
					let filteredBooks = books.filter( (book) => {
						return book.id !== requestedBook.id;
					});
					let updatedBooks = [...filteredBooks, offeredBook];
					user.userData.userBooks = updatedBooks;
					// update accepting user's received requests
					let currRequests = user.userData.receivedRequests;
					let updatedRequests = currRequests.filter( (request) => {
						return request.requestedBook.id !== requestedBook.id;
					});
					user.userData.receivedRequests = updatedRequests;
					// save user updates
					user.save(function(err) {
						if (err) throw err;
						res.status(201).send({ user });
					});
				}
			});
		}).catch(err => console.log(err));
	}
});
});

app.post('/decline-trade', (req, res) => {
	const { offeredBook, offerOwner, requestedBook, acceptingOwner, token } = req.body;
	jwt.verify(token, secret, (err, decoded) => {
		if (err) {
			res.status(401).send('You are not authorized!');
		} else {
			// for offer owner, remove pending request
			User.findOne({ id: offerOwner}, function(err, user) {
				if (err) throw err;
				else if (user) {
					let currPending = user.userData.pendingRequests;
					let newPending = currPending.filter( (request) => {
						return request.requestedBook.id !== requestedBook.id;
					});
					user.userData.pendingRequests = newPending;

					// create a notification for the trade rejection
					const notification = {
						id: uuid(),
						msg: `${acceptingOwner} rejected your request for ${requestedBook.title}! Too bad!`
					}
					let notificationsUpdate = user.userData.notifications.slice();
					notificationsUpdate.push(notification);
					user.userData.notifications = notificationsUpdate;

					user.save(function(err) {
						if (err) throw err;
					});
				}
			}).then( () => {
				// for accepting owner, remove received request
				User.findOne({ id: acceptingOwner }, function(err, user) {
					if (err) throw err;
					else if (user) {
						let currRequests = user.userData.receivedRequests;
						let newRequests = currRequests.filter( (request) => {
							return request.requestedBook.id !== requestedBook.id;
						});
						user.userData.receivedRequests = newRequests;
						user.save(function(err) {
							if (err) throw err;
							res.status(201).send(user);
						});
					}
				}).catch(err => console.log(err));
			});
		}
	});
});

app.post('/remove-notification', (req, res) => {

	const { token, notificationID, userID } = req.body;

	jwt.verify(token, secret, (err, decoded) => {
		if (err) {
			res.status(401).send('You are not authorized!');
		} else {

			// find user
			User.findOne({ id: userID }, function(err, user) {
				if (err) throw err;
				else if (user) {
					// update notifcations, removing the selected one
					let { notifications } = user.userData;
					let newNotifications = notifications.filter( (notification) => {
						return notification.id !== notificationID;
					});
					user.userData.notifications = newNotifications;
					user.save(function(err) {
						if (err) throw err;
						// return updated user data to client
						res.status(201).send(user.userData);;
					});
				}
			});

		}
	});

});














