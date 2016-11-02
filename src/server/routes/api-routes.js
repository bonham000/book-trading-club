import express from 'express'
import axios from 'axios'
import assert from 'assert'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import secret from '../jwt-config'
import dotenv from 'dotenv'
dotenv.config();

import XMLConverter from 'xmljson'

import User from '../models/users'

import mongodb from 'mongodb'
const MongoClient = mongodb.MongoClient;
const url = process.env.MONGO_HOST;

const app = module.exports = express.Router();

app.post('/api/protected', (req, res) => {
	let token = req.body.token;
	jwt.verify(token, secret, (err, decoded) => {
		if (!err) {
				MongoClient.connect(url, (err, db) => {
					assert.equal(null, err);			
				 	res.end();
					db.close();
				});
		}
		else {
			res.status(401).send('Token invalid, request denied.');
		}
	});
});

app.post('/add-book', (req, res) => {
	const { title, userID, token } = req.body;

	jwt.verify(token, secret, (err, decoded) => {
		if (!err) {
			axios.get(`https://www.goodreads.com/search/index.xml?key=${process.env.GOODREADS_KEY}&q=${title}`).then( (response) => {
				let result = response.data;
				XMLConverter.to_json(result, (err, data) => {
					if (!err) {

						const bookData = data.GoodreadsResponse.search.results.work[0].best_book

						const book = {
							id: bookData.id,
							title: bookData.title,
							author: bookData.author,
							image: bookData.author
						}

						console.log(book);

						User.findOne({ id: userID }, function(err, user) {
							if (err) throw err;
							else if (user) {
								let books = [...user.userData.userBooks, book]
								user.userData.userBooks = books;
								console.log(books);
								user.save(function(err) {
									if (err) throw err;
									else { res.status(201).send(user.userData) }
								});
							}
						});

					}
				});
			}).catch(err => console.log(err));
		}
		else {
			res.status(401).send('You are not authorized!');
		}

	});

});

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
