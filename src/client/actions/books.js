
import axios from 'axios'

import { updateUser } from './user'

export function addBook(data) {
	return dispatch => {
		axios.post('/add-book', data).then( (response) => {
			console.log(response.data);
			const user = response.data;
			// update returned user data in store
			dispatch(updateUser(user));
		}).catch(err => console.log(err));
	}
};