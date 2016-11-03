import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { addBook, removeBook } from '../actions/books'

@connect(
	state => ({
		user: state.user
	}),
	dispatch => ({
		addBook: bindActionCreators(addBook, dispatch),
		removeBook: bindActionCreators(removeBook, dispatch)
	})
)
class MyCollection extends React.Component {
	static propTypes = {
		addBook: React.PropTypes.func.isRequired,
		user: React.PropTypes.object.isRequired
	}
	componentDidMount() { window.addEventListener('keypress', this.handleKeypress) }
	constructor() {
		super();
		this.state = {
			title: '',
			submission: false
		}
		this.handleChange = this.handleChange.bind(this);
		this.handleKeypress = this.handleKeypress.bind(this);
		this.addBook = this.addBook.bind(this);
		this.removeBook = this.removeBook.bind(this);
	}
	handleKeypress(k) { if (k.keyCode === 13) { this.addBook() }}
	handleChange(e) { this.setState({ title: e.target.value, submission: false }) }
	addBook() {
		let { title } = this.state;
		if (title !== '') {
			// dispatch addd action
			this.props.addBook({
				userID: this.props.user.userID,
				token: localStorage.getItem('id_token'),
				title: title
			});
			this.setState({
				title: '',
				submission: true
			});
		}
	}
	removeBook(book) {
		const data = {
			bookID: book.id,
			userID: this.props.user.userID,
			token: localStorage.getItem('id_token')
		}
		// dispatch remove action
		this.props.removeBook(data)
	}
	render() {
		const renderBooks = this.props.user.userBooks.map( (book, idx) => {
			return (
				<div key = {idx} className = 'booksList'>
					<p className = 'title'>Title: {book.title}</p>
					<p className = 'author'>Author: {book.author} <button onClick = {this.removeBook.bind(this, book)}>Remove</button> </p>
				</div>
			);
		});
		return (
			<div className = 'myCollectionComponent'>
				<h1>Add a New Book to Your Collection</h1>
				<input
					type = "text"
					autoFocus
					placeholder = "Type a book title" 
					value = {this.state.title}
					onChange = {this.handleChange} /><br />
				<button onClick = {this.addBook}>Search and Add Book</button>
				{ this.state.submission && <p className = 'submission'>New book added!</p> }
				<hr />
				{ this.props.user.userBooks.length > 0 ?
				<h1>Your Current Collection:</h1> : <h1>You haven't added any books yet!</h1> }
				{renderBooks}
			</div>
		);
	}
};

export default MyCollection;