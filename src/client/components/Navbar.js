import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'

import { logoutUser } from '../actions/logout'

class Navbar extends Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
    errorMessage: PropTypes.string
  }
  render() {
    const { dispatch, isAuthenticated, errorMessage } = this.props
    return (
        <div className = "navigationWrapper">
          <div className = "linksWrapper">

            { !isAuthenticated &&
              <Link to = '/' className = 'navLink' activeClassName = 'activeRoute'>Home</Link> }

            { isAuthenticated &&
              <Link to = 'dashboard' className = 'navLink' activeClassName = 'activeRoute'>Dashboard</Link> }
            { isAuthenticated &&
              <Link to = 'my-collection' className = 'navLink' activeClassName = 'activeRoute'>My Books</Link> }
            { isAuthenticated && 
              <Link to = 'view-all' className = 'navLink' activeClassName = 'activeRoute'>View All Books</Link> }
            { isAuthenticated &&
              <Link to = 'my-account' className = 'navLink' activeClassName = 'activeRoute'>My Account</Link> }
            { isAuthenticated && 
              <Link className = 'navLink' onClick = { () => dispatch(logoutUser()) }>Logout</Link> }

            { !isAuthenticated &&
              <Link to = 'login' className = 'navLink' activeClassName = 'activeRoute'>Login</Link> }

            { !isAuthenticated &&
              <Link to = 'signup' className = 'navLink' activeClassName = 'activeRoute'>Sign Up</Link> }

          </div>
        </div>
    )
  }
}

export default Navbar;