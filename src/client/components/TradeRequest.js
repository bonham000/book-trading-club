import React from 'react'

class TradeRequest extends React.Component {
	render() {
		let firstOption = {
			id: 1,
			title: 'Select a Book'
		}
		let { books } = this.props;
		let optionsList = [firstOption, ...books];

		const renderOptions = optionsList.map( (book, idx) => {
			  return (
					<option
						value = {book.id}
						key = {idx} >
						{book.title}
					</option>
				)
		});
		return (
			<div className = 'tradeRequest'>
				<h1>Create Trade Request</h1>
				<p>You are requesting {this.props.reqBook.title} by {this.props.reqBook.author} from {this.props.reqBook.owner}.
				 Please select the book from your collection you would like to trade for this one.</p>
				
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
							<p className = 'success'>Thank you! Your trade request has been submitted to the book owner.</p> 	
							<button onClick = {this.props.cancelTrade}>Close this window</button>
						</div>

					}

			</div>
		);
	}
};

export default TradeRequest;