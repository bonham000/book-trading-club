
import { combineReducers } from 'redux'

import { SET_ALL_BOOKS } from '../actions/books'

const books = (state = [], action) => {
	
	switch(action.type) {
	
		case SET_ALL_BOOKS:
		 return action.books;
	
		default:
			return state
	
	}

}

export default books;