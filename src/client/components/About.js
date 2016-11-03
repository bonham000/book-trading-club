import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { browserHistory, Link } from 'react-router'

import BooksList from './BooksList'

import { retrieveAllBooks } from '../actions/books'

@connect(
	state => ({
		isAuthenticated: state.auth.isAuthenticated
	}),
	dispatch => ({
		getAllBooks: bindActionCreators(retrieveAllBooks, dispatch)
	})
)
class About extends React.Component {
	 constructor(props) {
    super(props);
  }
  componentWillMount() { this.props.getAllBooks() }
 	render() {
 		return (
		  <div className = 'aboutWrapper'>
		    <h1>Welcome to the Free Code Camp Book Trading Club</h1>

		    { !this.props.isAuthenticated && <div>
		    	<h3>Please <Link to = '/login'>login</Link> or <Link to = '/signup'>sign up</Link> to add books and propose trades.</h3>
		    </div> }

				{ this.props.isAuthenticated && <div>
					<h2>Welcome {localStorage.getItem('user')}</h2>
					<p>This voting app allows you to trade books with your friends. Enjoy learning! <i className = "em em-smile"></i>
					</p>
					<h3 className = 'credits'><a target = "_blank" href = "https://github.com/bonham000/book-trading-club">View the source on GitHub</a></h3>
					<h3 className = 'credits'>This app was created with React and Redux and is a <a target = "_blank" href = "https://www.freecodecamp.com/challenges/manage-a-book-trading-club">project for Free Code Camp</a>.</h3>
					</div> }

				<BooksList />

		  </div>
	  );
 	}
}
export default About;
