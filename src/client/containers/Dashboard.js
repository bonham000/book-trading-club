import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import Trades from '../components/Trades'
import BooksList from '../components/BooksList'

class Dashboard extends React.Component {
	 constructor(props) {
    super(props);
  }
 	render() {
 		return (
		  <div className = 'dashboardComponent'>
				<Trades />
				<BooksList />
		  </div>
	  );
 	}
}

export default Dashboard;