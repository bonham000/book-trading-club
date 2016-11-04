import express from 'express'
import passport from 'passport'
import GitHubStrategy from 'passport-github2'
import jwt from 'jsonwebtoken'
import secret from '../jwt-config'
import uuid from 'uuid-v4'

import User from '../models/users'

import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL_PROD } from '../index'

const app = module.exports = express.Router();

function createToken(username) { return jwt.sign({user: username}, secret, { expiresIn: 60 * 60 }) }

// define GitHub strategy
passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: GITHUB_CALLBACK_URL_PROD
  },
  function(accessToken, refreshToken, profile, done) {
    // search for user in database base on id = GitHub email address as unique identification
    User.findOne({ id: profile.emails[0].value }, function(err, user) {
      // handle error
      if (err) { return done(err) }
      // if there is no user with this email, create a new one
      if (!user) {
        user = new User({
            id: profile.emails[0].value,
            displayName: profile.displayName,
            username: profile.username,
            password: '',
            githubId: profile.id,
            userData: {
              userID: profile.emails[0].value,
              username: profile.username,
              fullName: profile.displayName,
              location: '',
              userBooks: [],
              pendingRequests: [],
              receivedRequests: [],
              notifications: []
            }
        });
        user.save(function(err) {
            if (err) console.log(err);
            return done(err, user);
        });
      // if user already has an account with this email, add their github ID  
      } else if (profile.emails[0].value === user.id) {
        user.githubId = profile.id
        user.save(function(err) {
            if (err) console.log(err);
            return done(err, user);
        });
      // user has logged in before, return user and proceed
      } else {
          console.log('user,', user);
          return done(err, user);
      }
    });
   }
));

// request for GitHub authentication
app.get('/auth/github', passport.authenticate('github'));

// GitHub callback
app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to for client to continue auth process
		res.redirect('/account');
});

// client verifies auth flow from passport redirect are receives jwt token in response or redirects to login page otherwise
app.post('/verify', function(req, res){

  // if user is authenticated find them in the database to return
  // their user data and send them a jwt token for client authentication
  if (req.isAuthenticated()) {

    User.findOne( {id: req.user.id }, function(err, user) {
      
      if (err) return done(err);
      
      else if (user) {

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
          id_token: createToken(req.user.username),
          user: req.user.username,
          userData: user.userData
        });
      }

  });
  // if session is not authenticated redirect to login
  } else { res.redirect('/login') }
 });

// handle logout in passport
app.get('/logout-passport', function(req, res) { req.logout() });
