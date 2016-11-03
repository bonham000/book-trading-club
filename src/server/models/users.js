'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
		id: String,
		displayName: String,
		username: String,
		password: String,
		githubId: String,
	  userData: {
	  	userID: String,
	    username: String,
	    fullName: String,
	    location: String,
	    userBooks: Array,
	    pendingRequests: Array,
	    receivedRequests: Array,
	    notifications: Array
	  }
});

module.exports = mongoose.model('User', User);