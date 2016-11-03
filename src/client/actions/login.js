import axios from 'axios'
import { browserHistory } from 'react-router'

import { initializeUser } from './user'
import { retrieveAllBooks } from './books'

import HOST_URL from '../constants/host'

// There are three possible states for our login process and we need actions for each of them
export const LOGIN_REQUEST = 'LOGIN_REQUEST'
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
export const LOGIN_FAILURE = 'LOGIN_FAILURE'

function requestLogin(creds) {
  return {
    type: LOGIN_REQUEST,
    isFetching: true,
    isAuthenticated: false,
    creds
  }
}

function receiveLogin(user) {
  return {
    type: LOGIN_SUCCESS,
    isFetching: false,
    isAuthenticated: true,
    id_token: user.id_token
  }
}

function loginError(error) {
  return {
    type: LOGIN_FAILURE,
    isFetching: false,
    isAuthenticated: false,
    error
  }
}

export function checkCredentials() {
  return dispatch => {
    return axios.post(HOST_URL + '/verify').then ( (response) => {
      if (response.status === 401) {
        console.log('You are not authenticated', err.response.data);
        dispatch(loginError(err.response.data));
        browserHistory.push('/login');
      }
      }).catch(err => { 
        console.log('There was an error checking your credentials');;
      });
    }
  }

// this checks authentication against passport login
export function checkAuth() {
  return dispatch => {
    return axios.post(HOST_URL + '/verify').then ( (response) => {
      if (response.status === 201) {

          const user = response.data;

          // If login was successful, set the token in local storage
          localStorage.setItem('user', user.user)
          localStorage.setItem('id_token', user.id_token)

          // Dispatch the success action and
          // initialize user in Redux store
          dispatch(receiveLogin(user))
          dispatch(initializeUser(user.userData))
          dispatch(retrieveAllBooks())

          browserHistory.push('/dashboard');
        }
      }).catch(err => { 
        console.log('You are not authenticated', err.response.data);
        dispatch(loginError(err.response.data));
        browserHistory.push('/login');
      });
    }
  }


// this logins in an existing user
export function loginUser(creds) {
 
  return dispatch => {
    // We dispatch requestLogin to kickoff the call to the API
    dispatch(requestLogin(creds))

    return axios.post(HOST_URL + '/sessions/create', creds).then( (response) => {
      
      if (response.status === 201) {
          const user = response.data;

          // If login was successful, set the token in local storage
          localStorage.setItem('user', user.user)
          localStorage.setItem('id_token', user.id_token)

          // Dispatch the success action and
          // initialize user in Redux store
          dispatch(receiveLogin(user))
          dispatch(initializeUser(user.userData))

          dispatch(retrieveAllBooks())

          browserHistory.push('/dashboard');
        }
      }).catch(err => { 
        console.log('Authentication failed:', err.response.data);
        dispatch(loginError(err.response.data));
    })
  }
}

export const NEW_SIGNUP = 'NEW_SIGNUP'
export const REGISTRATION_ERROR = 'REGISTRATION_ERROR'

export function newSignUp(user) {
  return {
    type: NEW_SIGNUP,
    isFetching: true,
    isAuthenticated: false
  }
}

export function registrationError(error) {
  return {
    type: REGISTRATION_ERROR,
    isFetching: false,
    isAuthenticated: false,
    error
  }
}

// this registers a new user
export function registerUser(user) {

  return dispatch => {

    // New signup action is dispatched
    dispatch(newSignUp(user))

    // Request is made to the server with the registration data
    return axios.post(host_url + '/register', user).then( (res) => {

      let user = {
        user: res.data.username,
        id_token: res.data.id_token
      }

      // Successful server response data is saved to local storage      
      localStorage.setItem('user', user.user);
      localStorage.setItem('id_token', user.id_token);

      // Dispatch the success action and
      // initialize user in Redux store
      dispatch(receiveLogin(user))
      dispatch(initializeUser(res.data.userData))
      dispatch(retrieveAllBooks())

    }).then( () => {
      // User is redirected to the home page
      browserHistory.push('/dashboard');
    }).catch( (err) => {
      console.log('Registration Error:', err.response.data);
      dispatch(registrationError(err.response.data));
    });

  }
}