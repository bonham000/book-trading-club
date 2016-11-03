import React from 'react'
import { connect } from 'react-redux'

@connect(
	state => ({
		books: state.books
	})
)
class ViewAll extends React.Component {
	 static propTypes = {
	 	books: React.PropTypes.array.isRequired
	 }
	 constructor(props) {
    super(props);
  }
 	render() {
 		const { books } = this.props;
 		const renderList = books.map( (book, idx) => {
			return (
				<div key = {idx}>
					<p>{book.title}</p>
				</div>
			);
		});
 		return (
		  <div className = 'viewallComponent'>
		    <h1>All Uploaded Books</h1>
		    {renderList}
		  </div>
	  );
 	}
}

export default ViewAll;
