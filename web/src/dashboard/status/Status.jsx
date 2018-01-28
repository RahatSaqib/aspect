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
import { fetchSummaryDashboard } from '../DashboardRedux'
import messages from './messages'
import DeviceStatus from './DeviceStatus'
import InventoryStatus from './InventoryStatus'
import ResultStatus from './ResultStatus'
import SiteStatus from './SiteStatus'
import requirePermissions from '../../components/shared/requirePermissions'

const cssClasses = classnames.bind(require('./Status.css'))

const enhanceSiteUnit = compose(
  requirePermissions({
    permissions: ['site:admin', 'site:view', 'site:edit'],
  })
)

const enhanceDeviceUnit = compose(
  requirePermissions({
    permissions: ['device:admin', 'device:view', 'device:edit'],
  })
)

const enhanceResultUnit = compose(
  requirePermissions({
    permissions: ['result:admin', 'result:view', 'result:edit'],
  })
)

const enhancePersonUnit = compose(
  requirePermissions({
    permissions: ['person:admin', 'person:view', 'person:edit'],
  })
)
const SiteSummary = enhanceSiteUnit(({ summary, intl }) => (
  <Unit sm="1-2" lg="1-4">
    <Link to="/browse/site" className={cssClasses('Summary')}>
      <Card className={cssClasses('Summary__Card')}>
        <div className={cssClasses('Summary__Card__Title')}>
          <MdPlace className={cssClasses('Summary__Card__Title__Icon')} />
          {intl.formatMessage(messages.sitesTitle)}
        </div>
        <div className={cssClasses('Summary__Card__Count')}>
          {intl.formatNumber(summary.get('sitesTotal', 0))}
        </div>
      </Card>
    </Link>
  </Unit>
))

const DeviceSummary = enhanceDeviceUnit(({ summary, intl }) => (
  <Unit sm="1-2" lg="1-4">
    <Link to="/browse/device" className={cssClasses('Summary')}>
      <Card className={cssClasses('Summary__Card')}>
        <div className={cssClasses('Summary__Card__Title')}>
          <MdComputer className={cssClasses('Summary__Card__Title__Icon')} />
          {intl.formatMessage(messages.devicesTitle)}
        </div>
        <div className={cssClasses('Summary__Card__Count')}>
          {intl.formatNumber(summary.get('devicesTotal', 0))}
        </div>
      </Card>
    </Link>
  </Unit>
))
const ResultSummary = enhanceResultUnit(({ summary, intl }) => (
  <Unit sm="1-2" lg="1-4">
    <Link to="/browse/result" className={cssClasses('Summary')}>
      <Card className={cssClasses('Summary__Card')}>
        <div className={cssClasses('Summary__Card__Title')}>
          <MdAssignment className={cssClasses('Summary__Card__Title__Icon')} />
          {intl.formatMessage(messages.resultsTitle)}
          <span className={cssClasses('Summary__Card__Title__Sub')}>
            ({intl.formatMessage(messages.last30Days)})
          </span>
        </div>
        <div className={cssClasses('Summary__Card__Count')}>
          {intl.formatNumber(summary.get('resultsTotal30d', 0))}
        </div>
      </Card>
    </Link>
  </Unit>
))
const PersonSummary = enhancePersonUnit(({ summary, intl }) => (
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
          {intl.formatNumber(summary.get('usersTotal', 0))}
        </div>
      </Card>
    </Link>
  </Unit>
))
const enhance = compose(
  connect(
    state => ({
      userName: state.user.jwt.name,
      summary: state.dashboard.summary,
    }),
    bindActionCreators.bind(null, {
      showAcknowledgement,
      fetchSummaryDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchSummaryDashboard()
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
  summary,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title="Status" />
    <div className={cssClasses('Section--summary')}>
      <SiteSummary intl={intl} summary={summary} />
      <DeviceSummary intl={intl} summary={summary} />
      <ResultSummary intl={intl} summary={summary} />
      <PersonSummary intl={intl} summary={summary} />
    </div>

    <ResultStatus
      intl={intl}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.clinicalTitle)}
    />

    <InventoryStatus
      history={history}
      intl={intl}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.consumableTitle)}
    />

    <DeviceStatus
      history={history}
      intl={intl}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.devicesTitle)}
    />

    <SiteStatus
      history={history}
      intl={intl}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.sitesTitle)}
    />
  </div>
)

export default enhance(Status)
