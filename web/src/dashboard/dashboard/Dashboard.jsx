// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { connect } from 'react-redux'
import Snackbar from 'material-ui/Snackbar'
import Helmet from 'react-helmet'

// Our own imports
import MiniChart from '../../components/shared/MiniChart'
import DashboardDevices from './DashboardDevices'
import DashboardTests from './DashboardTests'
import DashboardSites from './DashboardSites'
import DashboardErrorRate from './DashboardErrorRate'
import styles from './Dashboard.css'

const messages = defineMessages({
  title: {
    id: 'pages.Dashboard.title',
    defaultMessage: 'Dashboard'
  }
})

export class Dashboard extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    userName: PropTypes.string,
    location: PropTypes.object.isRequired,
    strings: PropTypes.object
  }

  componentWillMount() {
    this.props.setPageTitle(null)
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className="pure-g">
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <DashboardDevices label={'Total Devices'} />
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <DashboardTests label={'Total Tests'} />
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <DashboardSites label={'Sites'} />
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <DashboardErrorRate label={'Error Rate'} />
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Link to="/dashboard/inventory">
              <MiniChart  data={[1000, 1200, 700, 500, 400, 500, 600, 780, 1200, 1456]}
                          label={'Cartridges'} number={1456} bgcolor={'#607d8b'} />
              </Link>
          </div>
          <div className="pure-u-lg-1-4 pure-u-md-1-3 pure-u-sm-1-2">
            <Link to="/person">
              <MiniChart  data={[800, 700, 900, 1200, 1400, 1500, 1600, 1780]}
                          label={'Persons'} number={12} bgcolor={'#FBC02D'} />
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

function mapStateToProps(state) {
  return {
    userName: state.getIn(['user', 'name'])
  }
}

export const DashboardContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps)
)(Dashboard)
