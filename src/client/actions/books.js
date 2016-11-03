
import axios from 'axios'

import { updateUser } from './user'

export function addBook(data) {
	return dispatch => {
		axios.post('/add-book', data).then( (response) => {
			const user = response.data;
			// update returned user data in store
			dispatch(updateUser(user));
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