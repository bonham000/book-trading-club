import React from 'react'
import { connect } from 'react-redux'

import '../theme/booklist.scss'

@connect(
	state => ({
		books: state.books
	})
)
class BooksList extends React.Component {
	static propTypes = {
	 	books: React.PropTypes.array.isRequired
	}
 	render() {
 		const { books } = this.props;
 		const renderList = books.map( (book, idx) => {
			return (
				<div key = {idx} className = 'book'>
					<div className = 'image'>
						<img src = {book.image} alt = {book.title}/>
					</div>
					<div className = 'content'>
						<h2>{book.title}</h2>
						<p>by {book.author}</p>
					</div>
				</div>
			);
		});
 		return (
		  <div className = 'viewallComponent'>
		    <h2>Here are some of our current books:</h2>
		    {renderList}
		  </div>
	  );
 	}
}

export default BooksList;