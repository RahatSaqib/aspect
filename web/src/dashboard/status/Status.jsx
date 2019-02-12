import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, withState } from 'recompose'
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
import ActionStatus from './ActionStatus'
import TargetStatus from './TargetStatus'
import Reports from './Reports'
import BrowseSiteDropdown from '../../globals/components/BrowseSiteDropdown'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  connect(
    state => ({
      userName: state.user.jwt.name,
      countryIsoAlpha2Code: state.user.culture.substring(3, 5),
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
  }),
  withState('marginBottom', 'setMarginBottom', 0)
)

const Status = ({
  history,
  location,
  intl,
  marginBottom,
  setMarginBottom,
  countryIsoAlpha2Code,
}) => (
  <div className={cssClasses('Container')} style={{ marginBottom }}>
    <Helmet title="Status" />
    <div className={cssClasses('FiltersGroup')}>
      <BrowseSiteDropdown intl={intl} history={history} location={location} />
    </div>
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
      className={cssClasses('Section--withDropdown')}
      title={intl.formatMessage(messages.targetsTitle)}
    />

    <ActionStatus
      intl={intl}
      history={history}
      location={location}
      className={cssClasses('Section--withDropdown')}
      title={intl.formatMessage(messages.actionTitle)}
      marginBottom={marginBottom}
      setMarginBottom={setMarginBottom}
    />

    <ResultStatus
      intl={intl}
      countryIsoAlpha2Code={countryIsoAlpha2Code}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.clinicalTitle)}
    />

    <InventoryStatus
      history={history}
      intl={intl}
      countryIsoAlpha2Code={countryIsoAlpha2Code}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.consumableTitle)}
    />

    <DeviceStatus
      history={history}
      intl={intl}
      countryIsoAlpha2Code={countryIsoAlpha2Code}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.devicesTitle)}
    />

    <SiteStatus
      history={history}
      intl={intl}
      countryIsoAlpha2Code={countryIsoAlpha2Code}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.sitesTitle)}
    />

    <Reports
      intl={intl}
      location={location}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.reportsTitle)}
    />
  </div>
)

export default enhance(Status)
