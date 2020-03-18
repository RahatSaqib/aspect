/* eslint-disable linebreak-style */
import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, withState } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import messages from './messages'
import SummaryStatus from './SummaryStatus'
import InventoryStatus from './InventoryStatus'
import SiteStatus from './SiteStatus'
import ActionStatus from './ActionStatus'
import TargetStatus from './TargetStatus'
import Reports from './Reports'
import BrowseSiteDropdown from '../../globals/components/BrowseSiteDropdown'
import TreatmentStatus from './TreatmentStatus'
import ResultsByCategoryStatus from './ResultsByCategoryStatus'

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

    <TreatmentStatus
      intl={intl}
      history={history}
      location={location}
      className={cssClasses('Section--withDropdown')}
      title={intl.formatMessage(messages.treatmentTitle)}
    />

    {/* Loop through diseases user has access to start */}
    <ResultsByCategoryStatus
      intl={intl}
      history={history}
      location={location}
      className={cssClasses('Section--withStatus')}
      assayTypeId="GxHiv1Vl"
      keys={['LessThan1000', 'MoreThan1000', 'NotDetected']}
      title={intl.formatMessage(messages.resultsByCategoryTitle)}
    />

    <ResultsByCategoryStatus
      intl={intl}
      history={history}
      location={location}
      className={cssClasses('Section--withStatus')}
      assayTypeId="GxMtbRif"
      keys={['Detected', 'NotDetected']}
      title={intl.formatMessage(messages.resultsByCategoryTitle)}
    />
    {/* Loop through diseases user has access to end */}

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

    {/* ========Commenting out as per ASP-940 ==============
    <ResultStatus
      intl={intl}
      countryIsoAlpha2Code={countryIsoAlpha2Code}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.clinicalTitle)}
    /> */}

    <SiteStatus
      history={history}
      intl={intl}
      countryIsoAlpha2Code={countryIsoAlpha2Code}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.sitesTitle)}
    />
    <InventoryStatus
      history={history}
      intl={intl}
      countryIsoAlpha2Code={countryIsoAlpha2Code}
      className={cssClasses('Section--withStatus')}
      title={intl.formatMessage(messages.consumableTitle)}
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
