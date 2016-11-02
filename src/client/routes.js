import React from 'react'
import { Route } from 'react-router'
import App from './containers/App'
import About from './components/About'

import Dashboard from './containers/Dashboard'
import AddBook from './containers/AddBook'
import ViewAll from './containers/ViewAll'
import Account from './containers/Account'

import LoginPage from './containers/LoginPage'
import SignupPage from './containers/SignupPage'
import PassportAuth from './containers/PassportAuth'

export default (
  <Route name = 'home' component = {App}>
  	<Route path = '/' name = 'about' component = {About} />
  	<Route path = 'dashboard' name = 'dashboard' component = {Dashboard} />
  	<Route path = 'add-book' name = 'add-book' component = {AddBook} />
  	<Route path = 'view-all' name = 'view-all' component = {ViewAll} />
  	<Route path = 'my-account' name = 'my-account' component = {Account} />
  	<Route path = 'login' name = 'login' component = {LoginPage} />
  	<Route path = 'signup' name = 'signup' component = {SignupPage} />
  	<Route path = 'account' name = 'account' component = {PassportAuth} />
  </Route>
);
