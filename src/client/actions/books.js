
import axios from 'axios'

export function addBook(title) {
	return dispatch => {
		axios.post('/add-book', { title: title }).then( (response) => {
			console.log(response.data);
		});
	}
};