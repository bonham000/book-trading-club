import React from 'react'

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
		  </div>
	  );
 	}
}

export default Dashboard;