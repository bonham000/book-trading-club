import axios from 'axios'
import { browserHistory } from 'react-router'

import { removeUserDetails } from './user'

export const LOGOUT_REQUEST = 'LOGOUT_REQUEST'
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS'
export const LOGOUT_FAILURE = 'LOGOUT_FAILURE'

function requestLogout() {
  return {
    type: LOGOUT_REQUEST,
    isFetching: true,
    isAuthenticated: true
  }
}

function receiveLogout() {
  return {
    type: LOGOUT_SUCCESS,
    isFetching: false,
    isAuthenticated: false
  }
}

export function logoutUser() {
  return dispatch => {
    // dispatch logout action
    dispatch(requestLogout())
    // remove user authentication data from local storage and dispatch action
    localStorage.removeItem('id_token')
    localStorage.removeItem('user')
    dispatch(receiveLogout())
    // remove user details from state
    dispatch(removeUserDetails())
    // direct server to logout session
    axios.get('/logout-passport')
    // redirect home
    browserHistory.push('/')
  }
}