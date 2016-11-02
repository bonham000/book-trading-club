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
	    username: String,
	    fullName: String,
	    userBooks: String,
	    pendingRequests: Array,
	    receivedRequests: Array
	  }
});

module.exports = mongoose.model('User', User);