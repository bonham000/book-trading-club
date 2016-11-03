import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { retrieveAllBooks } from '../actions/books'
import { requestBookTrade } from '../actions/books'

import TradeRequest from '../components/TradeRequest'

@connect(
	state => ({
		books: state.books,
		user: state.user
	}),
	dispatch => ({
		getAllBooks: bindActionCreators(retrieveAllBooks, dispatch),
		dispatchTrade: bindActionCreators(requestBookTrade, dispatch)
	})
)
class ViewAll extends React.Component {
	 static propTypes = {
	 	books: React.PropTypes.array.isRequired
	 }
	 componentWillMount() { this.props.getAllBooks() }
	 constructor(props) {
    super(props);
    this.state = {
    	tradeOpen: false,
    	tradeSubmitted: false
    }
    this.toggleTradeMenu = this.toggleTradeMenu.bind(this);
    this.requestTrade = this.requestTrade.bind(this);
    this.submitTrade = this.submitTrade.bind(this);
    this.selectOption = this.selectOption.bind(this);
  }
  toggleTradeMenu() {
  	this.setState({ tradeOpen: !this.state.tradeOpen });
  	if (this.state.tradeSubmitted) { this.setState({ tradeSubmitted: false })}
  }
  requestTrade(book) {
  	this.toggleTradeMenu();
  	this.setState({
  		reqBook: book
  	});
  }
  selectOption(event) { 
  	let books = this.props.user.userBooks;
  	const bookID = event.target.value;
  	const book = books.filter( (book) => {
  		return book.id === bookID;
  	});
  	this.setState({
  		selectedOption: book[0]
  	});
  }
  submitTrade() {
  	const trade = {
  		reqBook: this.state.reqBook,
  		reqBookOwner: this.state.reqBook.owner,
  		offerBook: this.state.selectedOption,
  		owner: this.props.user.userID,
  		token: localStorage.getItem('id_token')
  	}
  	this.setState({ tradeSubmitted: true });
  	console.log(trade);
  	// dispatch trade action to redux here
  	this.props.dispatchTrade(trade);
  }
 	render() {
 		const { books } = this.props;
 		const filteredList = books.filter( (book) => {
 			return book.owner !== this.props.user.userID;
 		});
 		const renderList = filteredList.map( (book, idx) => {
			return (
				<div key = {idx} className = 'book'>
					<div className = 'image'>
						<img src = {book.image} alt = {book.title}/>
					</div>
					<div className = 'content'>
						<h2>{book.title}</h2>
						<p>by {book.author}</p>
						<button onClick = {this.requestTrade.bind(this, book)}>Request a Trade</button>
					</div>
				</div>
			);
		});
 		return (
 			<div className = 'viewallComponent'>
			  <div>
			    <h1>Books Available for Trade from Other Users</h1>
			    {renderList}
			  </div>

				  { 

				  	this.state.tradeOpen

				  	&&

				  	<TradeRequest 
				  		cancelTrade = {this.toggleTradeMenu}
				  		submitTrade = {this.submitTrade}
				  		reqBook = {this.state.reqBook} 
				  		books = {this.props.user.userBooks}
				  		selectOption = {this.selectOption} 
				  		tradeSubmitted = {this.state.tradeSubmitted} />

				  }

			</div>
	  );
 	}
}

export default ViewAll;
