import React from 'react';
import Paper from 'material-ui/Paper';
import Snackbar from 'material-ui/Snackbar';

class Dashboard extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="content">
        <h1 className="content-h1" >Dashboard</h1>
        <div className="pure-g">
          <div className="pure-u-md-1-3">
            <Paper>
            &nbsp;
            </Paper>
          </div>
          <div className="pure-u-md-1-3">
            <Paper>
            &nbsp;
            </Paper>
          </div>
          <div className="pure-u-md-1-3">
            <Paper>
            &nbsp;
            </Paper>
          </div>
        </div>

        <Snackbar
            open={this.props.location.search.indexOf('fl') !== -1}
            autoHideDuration={3000}
            message={'Welcome, ' + window.sessionStorage.accessToken + '!'}  />

      </div>
    );
  }
}

export default Dashboard;
