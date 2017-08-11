import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'
import { Card } from 'react-toolbox/lib/card'
import MdPlace from 'react-icons/lib/md/place'
import MdComputer from 'react-icons/lib/md/computer'
import MdAssignment from 'react-icons/lib/md/assignment'
import MdPermIdentity from 'react-icons/lib/md/perm-identity'

import { Unit } from '../../components/pureGrids'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import { fetchDashboardStatus } from '../DashboardRedux'
import messages from './messages'
import DeviceStatus from './DeviceStatus'
import InventoryStatus from './InventoryStatus'
import ResultStatus from './ResultStatus'
import SiteStatus from './SiteStatus'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  connect(
    state => ({
      userName: state.getIn(['user', 'name']),
      status: state.getIn(['dashboard', 'status']),
    }),
    bindActionCreators.bind(null, {
      showAcknowledgement,
      fetchDashboardStatus,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchDashboardStatus()
    },

    componentWillReceiveProps(nextProps) {
      const { location, showAcknowledgement, userName } = nextProps
      const search = new URLSearchParams(location.search)

      if (search.has('fl') && nextProps.userName !== this.props.userName) {
        showAcknowledgement({
          title: messages.welcome,
          messageValues: { userName },
        })
      }
    },
  })
)

export const Status = ({
  history,
  intl,
  // --- injected by recompose ---
  status,
}) =>
  <div className={cssClasses('Container')}>
    <Helmet title="Status" />
    <div className={cssClasses('Section')}>
      <Unit sm="1-2" lg="1-4">
        <Link to="/browse/site" className={cssClasses('Summary')}>
          <Card className={cssClasses('Summary__Card')}>
            <div className={cssClasses('Summary__Card__Title')}>
              <MdPlace className={cssClasses('Summary__Card__Title__Icon')} />
              {intl.formatMessage(messages.sitesTitle)}
            </div>
            <div className={cssClasses('Summary__Card__Count')}>
              {intl.formatNumber(status.get('sitesTotal', 0))}
            </div>
          </Card>
        </Link>
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <Link to="/browse/device" className={cssClasses('Summary')}>
          <Card className={cssClasses('Summary__Card')}>
            <div className={cssClasses('Summary__Card__Title')}>
              <MdComputer
                className={cssClasses('Summary__Card__Title__Icon')}
              />
              {intl.formatMessage(messages.devicesTitle)}
            </div>
            <div className={cssClasses('Summary__Card__Count')}>
              {intl.formatNumber(status.get('devicesTotal', 0))}
            </div>
          </Card>
        </Link>
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <Link to="/browse/result" className={cssClasses('Summary')}>
          <Card className={cssClasses('Summary__Card')}>
            <div className={cssClasses('Summary__Card__Title')}>
              <MdAssignment
                className={cssClasses('Summary__Card__Title__Icon')}
              />
              {intl.formatMessage(messages.resultsTitle)}
              <span className={cssClasses('Summary__Card__Title__Sub')}>
                ({intl.formatMessage(messages.last30Days)})
              </span>
            </div>
            <div className={cssClasses('Summary__Card__Count')}>
              {intl.formatNumber(status.get('resultsTotal30d', 0))}
            </div>
          </Card>
        </Link>
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <Link to="/browse/person" className={cssClasses('Summary')}>
          <Card className={cssClasses('Summary__Card')}>
            <div className={cssClasses('Summary__Card__Title')}>
              <MdPermIdentity
                className={cssClasses('Summary__Card__Title__Icon')}
              />
              {intl.formatMessage(messages.usersTitle)}
            </div>
            <div className={cssClasses('Summary__Card__Count')}>
              {intl.formatNumber(status.get('usersTotal', 0))}
            </div>
          </Card>
        </Link>
      </Unit>
    </div>
    <div className={cssClasses('Section')}>
      {status.get('resultSummary') &&
        <ResultStatus
          intl={intl}
          className={cssClasses('Section__Content')}
          title={intl.formatMessage(messages.healthTitle)}
          data={status.get('resultSummary')}
        />}
    </div>
    <div className={cssClasses('Section')}>
      {status.get('inventorySummary') &&
        <InventoryStatus
          history={history}
          intl={intl}
          className={cssClasses('Section__Content')}
          title={intl.formatMessage(messages.consumableTitle)}
          data={status.get('inventorySummary')}
        />}
    </div>
    <div className={cssClasses('Section')}>
      {status.get('deviceSummary') &&
        <DeviceStatus
          intl={intl}
          className={cssClasses('Section__Content')}
          title={intl.formatMessage(messages.devicesTitle)}
          data={status.get('deviceSummary')}
        />}
    </div>
    <div className={cssClasses('Section')}>
      {status.get('siteSummary') &&
        <SiteStatus
          intl={intl}
          className={cssClasses('Section__Content')}
          title={intl.formatMessage(messages.sitesTitle)}
          data={status.get('siteSummary')}
        />}
    </div>
  </div>

export default enhance(Status)
