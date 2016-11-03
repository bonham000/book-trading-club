
import axios from 'axios'
import { browserHistory } from 'react-router'

import { logoutUser } from './logout'

export const INIT_USER = 'INIT_USER'
export const REMOVE_USER = 'REMOVE_USER'
export const UPDATE_USER = 'UPDATE_USER'

export function initializeUser(user) {
	return {
		type: INIT_USER,
		user: user
	}
}

export function updateUser(userData) {
	return {
		type: UPDATE_USER,
		user: userData
	}
}

export function updateUserInfo(userUpdate) {
	return dispatch => {
		axios.post('/update-user-info', userUpdate).then( (response) => {
			dispatch(updateUser(response.data));
		}).catch( (err) => {
			alert(err.response.data);
			dispatch(logoutUser());
		});
	}
}

export function removeUserDetails() {
	return {
		type: REMOVE_USER
	}
}

export function removeNotification(data) {
	return dispatch => {
		axios.post('/remove-notification', data).then( (res) => {
			dispatch(updateUser(res.data));
		}).catch(err => { console.log(err) });
	}
}