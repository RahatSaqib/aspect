import React from 'react'
import { defineMessages } from 'react-intl'
import Helmet from 'react-helmet'
import Grid from '@material-ui/core/Grid'
import classnames from 'classnames/bind'
import NavTitle from '../../globals/components/NavTitle'
import ReportCard from './ReportCard'
import config from '../../config'
import { getAspectAccess } from '../../globals/sideEffects/LocalStorage'

const cssClasses = classnames.bind(require('./ReportIndex.css'))

const messages = defineMessages({
  reportsTitle: {
    id: 'pages.ReportIndex.title',
    defaultMessage: 'Reports',
  },
})
const token = getAspectAccess()
const ReportIndex = ({ intl, history }) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.reportsTitle)} />
    <NavTitle title={intl.formatMessage(messages.reportsTitle)} />
    <Grid container>
      <ReportCard
        title="MTB Detected RR Detected"
        description="Contains all MTB Detected/RR Detected cases"
        linkUrl={`${config.aspectApi}/report/MTB_Detected_RR_Detected.xlsx?token=${token}`}
        history={history}
      />
      <ReportCard
        title="Critical Errors By Device"
        description="Includes a list of devices that had at least 2 critical errors"
        linkUrl={`${config.aspectApi}/report/DevicesWithErrors.xlsx?token=${token}`}
        history={history}
      />
      <ReportCard
        title="RIF Resistance Rate (%positive results)"
        description="Listing RIF Resistance Rate for all facilities, ranked highest to lowest."
        linkUrl={`${config.aspectApi}/report/RifResistanceRate.xlsx?token=${token}`}
        history={history}
      />
      <ReportCard
        title="Results with HIV Not Suppressed"
        description="All HIV results where the virus is not suppressed"
        linkUrl={`${config.aspectApi}/report/HIVNotSuppressed.xlsx?token=${token}`}
        history={history}
      />
    </Grid>
  </div>
)

export default ReportIndex
