import { combineReducers } from 'redux'

import auth from './auth-reducer'
import user from './user-reducer'
import books from './books-reducer'

export default combineReducers({
  auth,
  user,
  books
});
