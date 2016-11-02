import { combineReducers } from 'redux'

import { INIT_USER, REMOVE_USER, UPDATE_USER } from '../actions/user'

const defaultUser = {
	userID: '',
	username: '',
	fullName: '',
	location: '',
	userBooks: [],
	pendingRequests: [],
	receivedRequests: []
}

const user = (state = defaultUser, action) => {

	switch(action.type) {
	
		case INIT_USER:
			return Object.assign({}, state, {
				userID: action.user.userID,
				username: action.user.username,
				fullName: action.user.fullName,
				location: action.user.location,
				userBooks: action.user.userBooks,
				pendingRequests: action.user.pendingRequests,
				receivedRequests: action.user.receivedRequests
			});

		case UPDATE_USER:
			return Object.assign({}, state, action.user);

		case REMOVE_USER:
			return defaultUser;
	
		default:
			return state;

	}

}

export default user;