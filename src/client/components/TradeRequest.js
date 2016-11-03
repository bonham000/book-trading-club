import React from 'react'

class TradeRequest extends React.Component {
	render() {
		const renderOptions = this.props.books.map( (book, idx) => {
			if (idx === 0) {
				return (
					<option
						defaultValue = {book.id}
						key = {idx} >
						{book.title}
					</option>
				)
			} else { return (
					<option
						value = {book.id}
						key = {idx} >
						{book.title}
					</option>
				)
			}
		});
		return (
			<div className = 'tradeRequest'>
				<h1>Create Trade Request</h1>
				<p>You are requesting {this.props.reqBook.title} by {this.props.reqBook.author}</p>
				<p>Please select the book from your collection you would like to trade for this one.</p>
				
				<select onChange = {this.props.selectOption.bind(this)}>
					{renderOptions}
				</select>

					{

						!this.props.tradeSubmitted ? 
					
						<div>
							<button className = 'submitBtn' onClick = {this.props.submitTrade}>Submit Trade</button>
							<button className = 'cancelBtn' onClick = {this.props.cancelTrade}>Nevermind</button>	
						</div>

						:

						<div>
							<p>Thank you! Your trade has been submitted.</p> 	
							<button onClick = {this.props.cancelTrade}>Close this window</button>
						</div>

					}

			</div>
		);
	}
};

export default TradeRequest;