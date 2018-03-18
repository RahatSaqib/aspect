import classnames from 'classnames/bind'
import React from 'react'
import _ from 'lodash'
import { compose, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'
import { Card } from 'react-toolbox/lib/card'

import { Unit } from '../../components/pureGrids'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import { fetchSummaryDashboard } from '../DashboardRedux'
import messages from './messages'
import DeviceStatus from './DeviceStatus'
import InventoryStatus from './InventoryStatus'
import ResultStatus from './ResultStatus'
import SiteStatus from './SiteStatus'
import requirePermissions from '../../components/shared/requirePermissions'
import NotFound from '../../error/notFound/NotFound'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  requirePermissions({
    features: ['dashboard:true'],
    ForbiddenComponent: NotFound,
  }),
  connect(
    state => ({
      userName: state.user.jwt.name,
      summary: state.dashboard.summary,
      permissions: state.user.jwt.permissions,
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

const Icon = ({ icon, className }) => {
  try {
    const Icon = require(`react-icons/lib/md/${icon}`) // eslint-disable-line import/no-dynamic-require
    return <Icon className={className} />
  } catch (e) {
    return <div />
  }
}

const TargetLabel = ({ widget }) => {
  const isGreaterThan = parseFloat(widget.count) > parseFloat(widget.target)
  return (
    <span
      className={cssClasses('Summary__Card__Target', {
        'Summary__Card__Target--less': !isGreaterThan,
        'Summary__Card__Target--greater': isGreaterThan,
      })}
    >
      {widget.target}
    </span>
  )
}

export const Status = ({
  history,
  intl,
  // --- injected by recompose ---
  summary,
  permissions,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title="Status" />
    {(permissions.get('summaryDashboard:view') ||
      permissions.get('summaryDashboard:admin')) && (
      <div className={cssClasses('Section--summary')}>
        {_.map(summary.toJS(), widget => (
          <Unit sm="1-2" lg="1-4">
            <Link to={widget.link} className={cssClasses('Summary')}>
              <Card className={cssClasses('Summary__Card')}>
                <div className={cssClasses('Summary__Card__Title')}>
                  <Icon
                    icon={widget.icon}
                    className={cssClasses('Summary__Card__Title__Icon')}
                  />
                  {messages[widget.titleI18nKey]
                    ? intl.formatMessage(messages[widget.titleI18nKey])
                    : widget.title}
                  <span className={cssClasses('Summary__Card__Title__Sub')}>
                    {messages[widget.subTitleI18nKey]
                      ? intl.formatMessage(messages[widget.subTitleI18nKey])
                      : widget.subTitle}
                  </span>
                </div>
                <div className={cssClasses('Summary__Card__Content')}>
                  <span className={cssClasses('Summary__Card__Count')}>
                    {widget.count}
                  </span>
                  {widget.target && (
                    <TargetLabel
                      widget={widget}
                      intl={intl}
                      className={cssClasses('Summary__Card__Target')}
                    />
                  )}
                </div>
              </Card>
            </Link>
          </Unit>
        ))}
      </div>
    )}

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
