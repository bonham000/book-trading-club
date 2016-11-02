
import axios from 'axios'

export function addBook(data) {
	return dispatch => {
		axios.post('/add-book', data).then( (response) => {
			console.log(response.data);
			// receive user data in response and update user in store
		});
	}
};