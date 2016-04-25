import React from 'react';
import Snackbar from 'material-ui/Snackbar';

class Dashboard extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    console.log(this.props.location);
    return (
      <div>
      You're logged in!
      <Snackbar
          open={this.props.location.search.indexOf('fl') !== -1}
          autoHideDuration={3000}
          message={'Welcome, ' + window.sessionStorage.accessToken + '!'}
        />
      </div>
    );
  }
}

export default Dashboard;
