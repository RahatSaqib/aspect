// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import { Unit } from '../../components/pureGrids'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import DashboardDevices from './DashboardDevices'
import DashboardTests from './DashboardTests'
import DashboardSites from './DashboardSites'
import DashboardErrorRate from './DashboardErrorRate'
import DashboardContacts from './DashboardContacts'
import DashboardInventory from './DashboardInventory'
import styles from './Dashboard.css'

const messages = defineMessages({
  title: {
    id: 'pages.Dashboard.title',
    defaultMessage: 'Dashboard'
  },
  welcome: {
    id: 'pages.Dashboard.welcome',
    defaultMessage: 'Welcome {userName}'
  }
})

export class Dashboard extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    showAcknowledgement: PropTypes.func.isRequired,
    userName: PropTypes.string,
    location: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired
  }

  componentWillMount() {
    this.props.setPageTitle(null)
  }

  componentWillReceiveProps(nextProps) {
    const { location, showAcknowledgement, userName } = nextProps
    if (location.query.fl && nextProps.userName !== this.props.userName) {
      showAcknowledgement({
        title: messages.welcome,
        messageValues: { userName }
      })
    }
  }

  render() {
    const { intl: { formatMessage } } = this.props

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div>
          <Unit sm="1-2" md="1-3" lg="1-4">
            <DashboardDevices label={'Total Devices'} />
          </Unit>
          <Unit sm="1-2" md="1-3" lg="1-4">
            <DashboardTests label={'Total Tests'} />
          </Unit>
          <Unit sm="1-2" md="1-3" lg="1-4">
            <DashboardSites label={'Sites'} />
          </Unit>
          <Unit sm="1-2" md="1-3" lg="1-4">
            <DashboardErrorRate label={'Error Rate'} />
          </Unit>
          <Unit sm="1-2" md="1-3" lg="1-4">
            <DashboardInventory label={'Cartridges'} />
          </Unit>
          <Unit sm="1-2" md="1-3" lg="1-4">
            <DashboardContacts label={'Persons'} />
          </Unit>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    userName: state.getIn(['user', 'name'])
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    showAcknowledgement
  }, dispatch)
}

export const DashboardContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(Dashboard)
