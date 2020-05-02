import React, { useEffect, useState } from 'react'
import classnames from 'classnames/bind'
import { useSelector, useDispatch } from 'react-redux'
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
import GraphContainer from '../../MigratedComponents/Graphs/GraphContainer'
import ColorDemo from './ColorDemo/ColorDemo'

import covidGraphs from './GraphConfigurations/Covid'
import hivGraphs from './GraphConfigurations/HIV'
import tbGraphs from './GraphConfigurations/TB'

const cssClasses = classnames.bind(require('./Status.css'))

const Status = ({ history, location, intl, colorDemo = true }) => {
  const { covidRecoveryByGender, covidMortalityAndRecoveryConfig } = covidGraphs
  const { hivResults } = hivGraphs
  const { tbResults } = tbGraphs
  const [marginBottom, setMarginBottom] = useState(0)
  const dispatch = useDispatch()
  const userName = useSelector(({ user }) => user.jwt.name)
  const countryIsoAlpha2Code = useSelector(({ user }) =>
    user.culture.substring(3, 5)
  )
  const assays = useSelector(({ assay }) =>
    assay.items.toJS().filter(a => a.hasResults)
  )

  useEffect(() => {
    dispatch(fetchAssays(false))
  }, [dispatch])

  useEffect(() => {
    const { search } = location
    const searchParams = new URLSearchParams(search)

    if (searchParams.has('fl')) {
      showAcknowledgement({
        title: messages.welcome,
        messageValues: { userName },
      })
    }
  }, [userName, location])

  return (
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

      <GraphContainer
        intl={intl}
        history={history}
        location={location}
        assaysFromState={assays}
        config={hivResults}
      />

      <GraphContainer
        intl={intl}
        history={history}
        location={location}
        assaysFromState={assays}
        config={tbResults}
      />

      <GraphContainer
        intl={intl}
        history={history}
        location={location}
        assaysFromState={assays}
        config={covidMortalityAndRecoveryConfig}
      />

      <GraphContainer
        intl={intl}
        history={history}
        location={location}
        assaysFromState={assays}
        config={covidRecoveryByGender}
      />

      <TreatmentStatus
        intl={intl}
        history={history}
        location={location}
        className={cssClasses('Section--withDropdown')}
        title={intl.formatMessage(messages.treatmentTitle)}
      />
      {colorDemo && <ColorDemo vars={process.env} />}
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
}

export default Status
