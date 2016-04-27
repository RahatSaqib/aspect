import React from 'react';
import Paper from 'material-ui/Paper';
import Snackbar from 'material-ui/Snackbar';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

require('./../styles/Charts.css');

class Dashboard extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="content">
        <h1 className="content-h1">Dashboard</h1>
        <div className="pure-g">
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Paper className="col-margin" style={{backgroundColor: '#00bcd4'}}>
              <div className="minichart-chart">
                <Sparklines data={[1, 8, 15, 40, 45, 80, 90, 155]} width={100} height={80} margin={15} >
                    <SparklinesLine color={'#fff'} style={{fill: 'none'}} />
                    <SparklinesSpots style={{ fill: '#fff' }}  />
                </Sparklines>
              </div>
              <div className="minichart-count">
                  <small>Total Devices</small>
                  <span>155</span>
              </div>
              <div className="clear-fix" ></div>
            </Paper>
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Paper className="col-margin" style={{backgroundColor: '#8bc34a'}}>
              <div className="minichart-chart">
                <Sparklines data={[1000, 2000, 4000, 10000, 5000, 50000, 100000, 120000, 110000]} width={100} height={80} margin={15} >
                    <SparklinesLine color={'#fff'} style={{fill: 'none'}} />
                    <SparklinesSpots style={{ fill: '#fff' }}  />
                </Sparklines>
              </div>
              <div className="minichart-count">
                  <small>Total Tests</small>
                  <span>125,459</span>
              </div>
              <div className="clear-fix" ></div>
            </Paper>
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Paper className="col-margin" style={{backgroundColor: '#ff9800'}}>
              <div className="minichart-chart">
                <Sparklines data={[25, 12, 8, 2, 1]} width={105} height={80} margin={15} >
                    <SparklinesLine color={'#fff'} style={{fill: 'none'}} />
                    <SparklinesSpots style={{ fill: '#fff' }}  />
                </Sparklines>
              </div>
              <div className="minichart-count">
                  <small>Avg Error Rate</small>
                  <span>12%</span>
              </div>
              <div className="clear-fix" ></div>
            </Paper>
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Paper className="col-margin" style={{backgroundColor: '#607d8b'}}>
              <div className="minichart-chart">
                <Sparklines data={[1000, 1200, 700, 500, 400, 500, 600, 780, 1200, 1456]} width={100} height={80} margin={15} >
                    <SparklinesLine color={'#fff'} style={{fill: 'none'}} />
                    <SparklinesSpots style={{ fill: '#fff' }}  />
                </Sparklines>
              </div>
              <div className="minichart-count">
                  <small>Cartridges</small>
                  <span>1,456</span>
              </div>
              <div className="clear-fix" ></div>
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
