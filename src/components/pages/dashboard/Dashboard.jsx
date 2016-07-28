import React from 'react'
import { Link } from 'react-router'
import { connect } from 'react-redux'
import Snackbar from 'material-ui/Snackbar'
import PureRenderMixin from 'react-addons-pure-render-mixin'

import MiniChart from '../../shared/MiniChart'
import translate from '../../../i18n/translate'

export class Dashboard extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  render() {
    return (
      <div className="content">
        <div className="pure-g">
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Link to="/device">
              <MiniChart  data={[1, 8, 15, 40, 45, 80, 90, 155]}
                          label={"Total Devices"} number={155} bgcolor={'#00bcd4'}/>
            </Link>
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Link to="/result">
              <MiniChart  data={[1000, 2000, 4000, 10000, 5000, 50000, 100000, 120000, 110000]}
                        label={"Total Tests"} number={125459} bgcolor={'#8bc34a'} />
            </Link>
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Link to="/result">
              <MiniChart  data={[25, 12, 8, 2, 1]}
                        label={"Error Rate"} number={'12%'} bgcolor={'#ff9800'} />
            </Link>
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Link to="/dashboard/inventory">
              <MiniChart  data={[1000, 1200, 700, 500, 400, 500, 600, 780, 1200, 1456]}
                        label={"Cartridges"} number={1456} bgcolor={'#607d8b'} />
              </Link>
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Link to="/person">
              <MiniChart  data={[800, 700, 900, 1200, 1400, 1500, 1600, 1780]}
                        label={"Persons"} number={12} bgcolor={'#FBC02D'} />
            </Link>
          </div>
        </div>
        <Snackbar
            open={this.props.location.search.indexOf('fl') !== -1}
            autoHideDuration={3000}
            message={'Welcome, ' + this.props.userName + '!'}  />
      </div>
    )
  }
}

Dashboard.propTypes = {
  userName: React.PropTypes.string,
  location: React.PropTypes.object.isRequired,
  strings: React.PropTypes.object
}

Dashboard.defaultProps = {
  strings: {
    title: 'Dashboard'
  }
}

function mapStateToProps(state) {
  return {
    userName: state.getIn(['user', 'name'])
  }
}

const DashboardTranslated = translate('Dashboard')(Dashboard)
export const DashboardContainer = connect(mapStateToProps)(DashboardTranslated)
