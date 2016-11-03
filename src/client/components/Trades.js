import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

@connect(
	state => ({
		user: state.user
	})
)
class Trades extends React.Component {
	constructor(props) {
		super(props);
		this.state = {}
	}
	render() {
		const { pendingRequests } = this.props.user;
		const renderTrades = pendingRequests.map( (trade, idx) => {
			return (
				<div key = {idx}>
					<p>{trade.requestingOwner} is requesting {trade.requestedBook.title}
						in exchange for your copy of {trade.offeredBook.title}.</p>
					<h2>Would you like to accept?</h2>
					<button>Accept</button>
					<button>Decline</button>
				</div>
			);
		});
		return (
			<div>	
				
				<div>
					<h1>Your Outstanding Requests:</h1>
					{renderTrades}
				</div>

				<div>
					<h1>
						Requests to You:
					</h1>
				</div>			

			</div>
		);
	}
};

export default Trades;