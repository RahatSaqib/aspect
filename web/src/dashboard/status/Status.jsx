/* eslint-disable linebreak-style */
import classnames from 'classnames/bind'
import React from 'react'
import { compose, lifecycle, withState } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import { fetchAssays } from '../../assay/AssayRedux'
import messages from './messages'
import SummaryStatus from './SummaryStatus'
import InventoryStatus from './InventoryStatus'
import SiteStatus from './SiteStatus'
import ActionStatus from './ActionStatus'
import TargetStatus from './TargetStatus'
import Reports from './Reports'
import BrowseSiteDropdown from '../../globals/components/BrowseSiteDropdown'
import TreatmentStatus from './TreatmentStatus'
import ClinicalIndicators from './ClinicalIndicators/ClinicalIndicators'
import ColorDemo from './ColorDemo/ColorDemo'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = compose(
  connect(
    state => {
      const assayItems = state.assay.items.toJS()
      return {
        userName: state.user.jwt.name,
        countryIsoAlpha2Code: state.user.culture.substring(3, 5),
        assays: assayItems.filter(a => a.hasResults),
      }
    },
    bindActionCreators.bind(null, {
      fetchAssays,
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
    componentDidMount() {
      this.props.fetchAssays(false)
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
  assays,
  colorDemo = false,
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
    {colorDemo && <ColorDemo vars={process.env} />}
    {assays && assays.length ? (
      <ClinicalIndicators
        intl={intl}
        history={history}
        location={location}
        assays={assays}
      />
    ) : null}
    <TreatmentStatus
      intl={intl}
      history={history}
      location={location}
      className={cssClasses('Section--withDropdown')}
      title={intl.formatMessage(messages.treatmentTitle)}
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
