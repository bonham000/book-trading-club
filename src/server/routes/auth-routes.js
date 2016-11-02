import express from 'express'
import _ from 'lodash'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import secret from '../jwt-config'
import assert from 'assert'
import Validator from 'validator'
import validateUser from '../shared/validateUser'

import User from '../models/users'

const url = process.env.MONGO_HOST;

import mongodb from 'mongodb'
const MongoClient = mongodb.MongoClient;

const app = module.exports = express.Router();

// create a jwt token for authenticated users
function createToken(username) { return jwt.sign({user: username}, secret, { expiresIn: 60 * 60 }) }

// handle new user registration
app.post('/register', function(req, res) {
  const userInfo = req.body;
  console.log('New registration received on server:', userInfo);
  const validation = validateUser(userInfo)
  // Check if the user submitted all the fields correctly
  if (validation.isValid) {
        User.findOne({
            id: userInfo.email
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            // if there is no user with this email as id, create a new one
            if (!user) {
                const passwordDigest = bcrypt.hashSync(userInfo.password, 10);
                user = new User({ 
                    id: userInfo.email,
                    displayName: userInfo.username,
                    username: userInfo.username,
                    password: passwordDigest,
                    githubId: '',
                    twitterId: '',
                    userData: {
                      username: '',
                      fullName: '',
                      userBooks: '',
                      pendingRequests: [],
                      receivedRequests: []
                    }
                });
                user.save(function(err) {
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
                const passwordDigest = bcrypt.hashSync(user.password, 10);
                user.password = passwordDigest;
                user.save(function(err) {
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
      }
      else {
        console.log('Invalid Registration:', validation.errors);
        res.status(400).send('Registration was in valid:', validation.errors);
      }
});

// handle user login
app.post('/sessions/create', function(req, res) {

  const { email, password } = req.body;

  MongoClient.connect(url, (err, db) => {
    assert.equal(null, err);

    const Users = db.collection('users');
    
    Users.findOne( { id: email }).then( (data) => {
      // user does not exist in database
      if (data === null) {
        console.log('User does not exist');
        res.status(401).send('User does not exist');
        db.close();
      }
      // if user exists check if password is valid
      // if it is return user data and authentication credentials
      else if (bcrypt.compareSync(password, data.password)) {
        res.status(201).send({
          id_token: createToken(data.username),
          username: data.username,
          userData: data.userData
        });
        db.close();
      }
      // user exists but password was invalid
      else {
        res.status(401).send('Invalid login attempt')
        db.close();
      }
    });
  });
});