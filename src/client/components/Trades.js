import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { acceptTrade } from '../actions/books'
import { declineTrade } from '../actions/books'

@connect(
	state => ({
		user: state.user
	}),
	dispatch => ({
		accept: bindActionCreators(acceptTrade, dispatch),
		decline: bindActionCreators(declineTrade, dispatch)
	})
)
class Trades extends React.Component {
	constructor(props) {
		super(props);
		this.confirmTrade = this.confirmTrade.bind(this);
		this.rejectTrade = this.rejectTrade.bind(this);
	}
	confirmTrade(trade) {
		const { user } = this.props;
		const tradeData = Object.assign({}, trade, { acceptingOwner: user.userID, token: localStorage.getItem('id_token') });
		// dispatch accept action
		this.props.accept(tradeData);
	}
	rejectTrade(trade) {
		const { user } = this.props;
		const tradeData = Object.assign({}, trade, { acceptingOwner: user.userID, token: localStorage.getItem('id_token') });
		// dispatch decline action
		this.props.decline(tradeData);
	}
	render() {
		const { receivedRequests, pendingRequests } = this.props.user;
		const renderTrades = receivedRequests.map( (trade, idx) => {
			return (
				<div key = {idx} className = 'receivedRequests'>
					<p>{trade.offerOwner} is requesting your copy of {trade.requestedBook.title} in exchange for {trade.offeredBook.title}.</p>
					<h2>Would you like to accept?</h2>
					<button onClick = {this.confirmTrade.bind(this, trade)}>Accept</button>
					<button onClick = {this.rejectTrade.bind(this, trade)}>Decline</button>
				</div>
			);
		});
		const renderPending = pendingRequests.map( (request, idx) => {
			return (
				<div key = {idx} className = 'pendingRequests'>
					<h2>
						You have requested {request.requestedBook.title} from {request.acceptingOwner} in exchange for {request.offeredBook.title}.
					</h2>
				</div>
			)
		});
		return (
			<div className = 'openTradesWrapper'>	
				
				<div>
					<h1>Requests to You:</h1>
					{renderTrades}
				</div>	

				<div>
					<h1>Requests You've Made:</h1>
					{renderPending}
				</div>		

			</div>
		);
	}
};

export default Trades;