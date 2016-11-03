
import axios from 'axios'

import { updateUser } from './user'

export function addBook(data) {
	return dispatch => {
		axios.post('/add-book', data).then( (response) => {
			const user = response.data;
			// update returned user data in store
			dispatch(updateUser(user));
			dispatch(retrieveAllBooks())
		}).catch(err => console.log(err));
	}
};

export const SET_ALL_BOOKS = 'SET_ALL_BOOKS'

function setAllBooks(books) {
	return {
		type: SET_ALL_BOOKS,
		books
	}
}

function flatten(array) {
	let flatList = [];
	for (let i = 0; i < array.length; i++) {
		for (let j = 0; j < array[i].length; j++) {
			flatList.push(array[i][j]);
		}
	}
	return flatList;
}

export function retrieveAllBooks() {
	return dispatch => {
		axios.get('/get-all-books').then( (response) => {
			// server returns a nested array so let's flatten it here
			const books = flatten(response.data);
			dispatch(setAllBooks(books));
		}).catch(err => console.log(err));
	}
};


export function requestBookTrade(tradeInfo) {
	return dispatch => {
		axios.post('/request-trade', tradeInfo).then( (response) => {
			// user is updated with requested trade data
			dispatch(updateUser(response.data.user.userData));
		}).catch(err => alert(err));
	}
};


export function acceptTrade(trade) {
	return dispatch => {
		axios.post('/accept-trade', trade).then( (response) => {
			if (response.status === 201) {
				// for accept receive new user data and upate local state
				dispatch(updateUser(response.data.user.userData));
				// and dispatch request to get all books for updated book ownership
				dispatch(retrieveAllBooks());
			}
		}).catch(err => console.log(err));
	}
};

export function declineTrade(trade) {
	return dispatch => {
		axios.post('/decline-trade', trade).then( (response) => {
			// for decline receive new user data and update local state
			dispatch(updateUser(response.data.userData));
		}).catch(err => console.log(err));
	}
};

