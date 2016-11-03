import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { checkCredentials } from '../actions/login'

import Trades from '../components/Trades'
import BooksList from '../components/BooksList'

@connect(
	null,
	dispatch => ({
		checkCredentials: bindActionCreators(checkCredentials, dispatch)
	})
)
class Dashboard extends React.Component {
	 constructor(props) {
    super(props);
  }
  componentWillMount() { this.props.checkCredentials() }
 	render() {
 		return (
		  <div className = 'dashboardComponent'>
				<Trades />
		  </div>
	  );
 	}
}

export default Dashboard;