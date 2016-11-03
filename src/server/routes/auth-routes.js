import express from 'express'
import _ from 'lodash'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import secret from '../jwt-config'
import assert from 'assert'
import Validator from 'validator'
import validateUser from '../shared/validateUser'
import uuid from 'uuid-v4'
import dotenv from 'dotenv'
dotenv.config()

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

  User.findOne({ id: email }, function(err, user) {
    if (err) throw err;
    else if (user) {
      if (bcrypt.compareSync(password, user.password)) {

        // check received requests for any books user no longer has and remove these requests from their data
        let { userBooks, receivedRequests, pendingRequests } = user.userData;

        // this check is executed whenever a user logs in either directly (here) or through passport

        // this block of code checks the user's data for received and pending requests for books it no longer owns
        // if a book is found, the received request is removed, and then the pending request for the
        // offer owner of that request is found and removed as well, conversely, if there is a pending request
        // with an offer book the user no longer owns, the request is removed for both users

        // handle pending requests
        function testPendingRequests(books, offer) {
          let testBooks = books.filter( (book) => { return book.id === offer.offeredBook.id; });
          if (testBooks.length > 0) { return true; }
          else {
            let acceptingOwner = offer.acceptingOwner;
            // find offer owner in database and remove pending offered from their data
            User.findOne({ id: acceptingOwner }, function(err, user) {
              if (err) throw err;
              else if (user) {
                let { receivedRequests } = user.userData;
                let newRequests = receivedRequests.filter( (receivedRequest) => {
                  return receivedRequest.requestedBook.id !== offer.requestedBook.id;
                });
                // update pending requests of offer owner
                user.userData.receivedRequests = newRequests;

                const notification = {
                  id: uuid(),
                  msg: `${email} no longer owns ${offer.offeredBook.title} which they offered to trade you, so the trade has been removed.`
                }
                let notificationsUpdate = user.userData.notifications.slice();
                notificationsUpdate.push(notification);
                user.userData.notifications = notificationsUpdate;

                user.save(function(err) {
                  if (err) throw err;
                });
              }
            });
            return false;
          }
        }

        let newPending = pendingRequests.filter( (request) => { return testPendingRequests(userBooks, request) });
        user.userData.pendingRequests = newPending;

        // handle received requests
        function testReceivedRequests(books, request) {
          let testBooks = books.filter( (book) => { return book.id === request.requestedBook.id; });
          if (testBooks.length > 0) { return true; }
          else {
            let offerOwner = request.offeredBook.owner;
            // find offer owner in database and remove pending request from their data
            User.findOne({ id: offerOwner }, function(err, user) {
              if (err) throw err;
              else if (user) {
                let { pendingRequests } = user.userData;
                let newPending = pendingRequests.filter( (pendingRequest) => {
                  return pendingRequest.requestedBook.id !== request.requestedBook.id;
                });
                // update pending requests of offer owner
                user.userData.pendingRequests = newPending;
                
                const notification = {
                  id: uuid(),
                  msg: `${request.offeredBook.owner} no longer owns ${request.offeredBook.title} which they offered to trade you, so the trade has been removed.`
                }
                let notificationsUpdate = user.userData.notifications.slice();
                notificationsUpdate.push(notification);
                user.userData.notifications = notificationsUpdate;

                user.save(function(err) {
                  if (err) throw err;
                });
              }
            });
            return false;
          }
        }
        
        let newRequests = receivedRequests.filter( (request) => { return testReceivedRequests(userBooks, request) });
        // update recevied requests for user for them to see updated information upon login
        user.userData.receivedRequests = newRequests;
        user.save(function(err) { if (err) throw err; });
        // remove pending request from offer owner as well

        res.status(201).send({
          id_token: createToken(user.username),
          username: user.username,
          userData: user.userData
        });
      } else {
        res.status(401).send('Invalied credentials!');
      }

    } else {
      res.status(404).send('There is no user with this email!');
    }
  });
});




