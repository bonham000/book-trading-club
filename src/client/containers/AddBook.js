import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { addBook } from '../actions/books'

@connect(
	state => ({
		user: state.user
	}),
	dispatch => ({
		addBook: bindActionCreators(addBook, dispatch)
	})
)
class AddBook extends React.Component {
	static propTypes = {
		addBook: React.PropTypes.func.isRequired
	}
	componentDidMount() {
		window.addEventListener('keypress', this.handleKeypress);
	}
	constructor() {
		super();
		this.state = {
			title: ''
		}
		this.handleChange = this.handleChange.bind(this);
		this.handleKeypress = this.handleKeypress.bind(this);
		this.addBook = this.addBook.bind(this);
	}
	handleKeypress(k) { if (k.keyCode === 13) { this.addBook() }}
	handleChange(e) { this.setState({ title: e.target.value }) }
	addBook() {
		let { title } = this.state;
		if (title !== '') {
			this.props.addBook({
				userID: this.props.user.userID,
				token: localStorage.getItem('id_token'),
				title: title
			});
			this.setState({
				title: ''
			});
		}
	}
	render() {
		return (
			<div>
				<h1>Add a New Book to Your Collection</h1>
				<input
					type = "text"
					autoFocus
					placeholder = "Type a book title" 
					value = {this.state.title}
					onChange = {this.handleChange} /><br />
				<button onClick = {this.addBook}>Search and Add Book</button>
				<p>Your Current Collection:</p>
			</div>
		);
	}
};

export default AddBook;