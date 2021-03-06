import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { updateUserInfo } from '../actions/user'

import '../theme/account.scss'

@connect(
	state => ({
		user: state.user
	}),
	dispatch => ({
		updateUserInfo: bindActionCreators(updateUserInfo, dispatch)
	})
)
class Account extends React.Component {
	static propTypes = {
		user: React.PropTypes.object.isRequired,
		updateUserInfo: React.PropTypes.func.isRequired
	}
	componentDidMount() {
		const { user } = this.props;
		this.setState({
			fullName: user.fullName,
			location: user.location
		})
	}
	 constructor(props) {
    super(props);
    this.state = {
    	editProfile: false
    }
    this.toggleEdit = this.toggleEdit.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.cancelUpdates = this.cancelUpdates.bind(this);
    this.submitUpdates = this.submitUpdates.bind(this);
  }
  toggleEdit() {
  	this.setState({
  		editProfile: !this.state.editProfile
  	});
  }
  handleInput(event) {
  	this.setState({
  		[event.target.name]: event.target.value
  	});
  }
  submitUpdates() {
  	let { fullName, location } = this.state;
  	const userID = this.props.user.userID;
  	if ( fullName !== '' && location !== '' ) {
  		const userUpdate = {
  			userID,
  			fullName,
  			location,
  			token: localStorage.getItem('id_token')
  		}
  		this.props.updateUserInfo(userUpdate);
  		this.toggleEdit();
  	}
  }
  cancelUpdates() {
  	this.toggleEdit();
  }
 	render() {
 		const { user } = this.props;
 		return (
		  <div className = 'accountComponent'>
				<h1>Your Profile:</h1>
				
					{ this.state.editProfile ?

						<div>
							<label>Full Name:</label><br />
							<input
								type = "text"
								name = 'fullName'
								placeholder = 'Full Name'
								value = {this.state.fullName}
								onChange = {this.handleInput} /><br />
							<label>Location:</label><br />
							<input
								type = "text"
								name = 'location'
								placeholder = 'Location'
								value = {this.state.location}
								onChange = {this.handleInput} /><br />
							<button onClick = {this.submitUpdates}>Submit Updates</button><br />
							<button onClick = {this.cancelUpdates}>Cancel Changes</button>
						</div>

							:

						<div>
							<p><u>Username</u>: {user.username}</p>
							<p><u>Full Name</u>: {user.fullName}</p>
							{ user.location !== '' && <p>Location: {user.location}</p> }
							<button onClick = {this.toggleEdit}>Edit Your Personal Information</button>
						</div>

					}

		  </div>
	  );
 	}
};

export default Account;
