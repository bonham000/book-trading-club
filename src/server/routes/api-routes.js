import express from 'express'
import assert from 'assert'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import secret from '../jwt-config'
import dotenv from 'dotenv'
dotenv.config();

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

app.get('/goodreads', (req, res) => {

	console.log('API called:', req.body);

	axios.get(`https://www.goodreads.com/search.xml?key=${process.env.GOODREADS_KEY}&q=${req.body.query}`).then( (response) => {
		console.log(response);
	}).catch(err => console.log(err));

});



