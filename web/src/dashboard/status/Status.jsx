import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import messages from './messages'
import SummaryStatus from './SummaryStatus'
import DeviceStatus from './DeviceStatus'
import InventoryStatus from './InventoryStatus'
import ResultStatus from './ResultStatus'
import SiteStatus from './SiteStatus'
import requirePermissions from '../../components/shared/requirePermissions'
import NotFound from '../../error/notFound/NotFound'
import TargetStatus from './TargetStatus'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  requirePermissions({
    features: ['dashboard:true'],
    ForbiddenComponent: NotFound,
  }),
  connect(
    state => ({
      userName: state.user.jwt.name,
      features: state.user.jwt.features,
    }),
    bindActionCreators.bind(null, {
      showAcknowledgement,
    })
  ),
  lifecycle({
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

const Status = ({ history, location, intl }) => (
  <div className={cssClasses('Container')}>
    <Helmet title="Status" />

    <SummaryStatus
      intl={intl}
      history={history}
      location={location}
      className={cssClasses('Section--summary')}
    />

    <TargetStatus
      intl={intl}
      history={history}
      location={location}
      className={cssClasses('Section--target')}
      title={intl.formatMessage(messages.targetsTitle)}
    />

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
