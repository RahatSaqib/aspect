import React from 'react'
import { defineMessages } from 'react-intl'
import Helmet from 'react-helmet'
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
  deploymentName: {
    id: 'pages.ReportIndex.deploymentName',
    defaultMessage: 'Deployment Name',
  },
  moduleSerial: {
    id: 'pages.ReportIndex.moduleSerial',
    defaultMessage: 'Module Serial',
  },
  dateOfError: {
    id: 'pages.ReportIndex.dateOfError',
    defaultMessage: 'Date of Error',
  },
  error: {
    id: 'pages.ReportIndex.error',
    defaultMessage: 'Error',
  },
  totalTestsRun: {
    id: 'pages.ReportIndex.totalTestsRun',
    defaultMessage: 'Total Tests Run',
  },
  totalErrors: {
    id: 'pages.ReportIndex.totalErrors',
    defaultMessage: 'Total Errors',
  },
  paginatorStatus: {
    id: 'pages.ReportIndex.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# report}
      other {# reports}
    }`,
  },
})
const token = getAspectAccess()
const ReportIndex = ({ intl, className, history }) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.reportsTitle)} />
    <NavTitle title={intl.formatMessage(messages.reportsTitle)} />
    <div style={{ padding: 10, flex: 1 }}>
      <ReportCard
        className={className}
        title="MTB Detected RR Detected"
        description="Contains all MTB Detected/RR Detected cases"
        linkUrl={`${config.aspectApi}/report/MTB_Detected_RR_Detected.xlsx?token=${token}`}
        history={history}
      />

      <ReportCard
        className={className}
        title="Critical Errors By Device"
        description="Includes a list of devices that had at least 2 critical errors"
        linkUrl={`${config.aspectApi}/report/DevicesWithErrors.xlsx?token=${token}`}
        history={history}
      />
      <ReportCard
        className={className}
        title="RIF Resistance Rate (%positive results)"
        description="Listing RIF Resistance Rate for all facilities, ranked highest to lowest."
        linkUrl={`${config.aspectApi}/report/RifResistanceRate.xlsx?token=${token}`}
        history={history}
      />
      <ReportCard
        className={className}
        title="Results with HIV Not Suppressed"
        description="All HIV results where the virus is not suppressed"
        linkUrl={`${config.aspectApi}/report/HIVNotSuppressed.xlsx?token=${token}`}
        history={history}
      />
    </div>
  </div>
)

export default ReportIndex
