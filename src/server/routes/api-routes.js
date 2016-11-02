import express from 'express'
import assert from 'assert'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import secret from '../jwt-config'
import dotenv from 'dotenv'
dotenv.config();

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

app.get('/goodreads', (req, res) => {

	console.log('API called:', req.body);

	axios.get(`https://www.goodreads.com/search.xml?key=${process.env.GOODREADS_KEY}&q=${req.body.query}`).then( (response) => {
		console.log(response);
	}).catch(err => console.log(err));

});



