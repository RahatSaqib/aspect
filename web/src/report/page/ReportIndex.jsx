import _ from 'lodash'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import Grid from '@material-ui/core/Grid'
import classnames from 'classnames/bind'

import {
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import ReportCard from './ReportCard'
import config from '../../config'
import { getAspectAccess } from '../../globals/sideEffects/LocalStorage'
import { fetchReports, getReportFile } from '../ReportRedux'

const cssClasses = classnames.bind(require('./ReportIndex.css'))

const messages = defineMessages({
  reportsTitle: {
    id: 'pages.ReportIndex.title',
    defaultMessage: 'Reports',
  },
})
const token = getAspectAccess()

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site:view', 'site:admin', 'site:edit'],
  },
  { date: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer()
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const enhance = compose(
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
    return {
      filters: _.fromPairs([...filtersParams.entries()]),
    }
  }),
  connect(
    state => ({
      items: state.report.items,
      loading: state.report.loading,
      userPermissions: state.user.jwt.permissions,
    }),
    {
      fetchReports,
      getReportFile,
    }
  ),
  withHandlers({
    onInitialLoad: ({ location, fetchReports }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchReports(filtersParams)
      }
    },
    onClickDownload: ({ location, getReportFile }) => externalId => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        getReportFile(externalId, filtersParams)
      }
    },
    onStaticFile: ({ location }) => fileName => {
      const linkUrl = `${config.aspectApi}/report/${fileName}?token=${token}`
      window.location.href = linkUrl
    },
  }),
  lifecycle({
    componentDidMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.history.replace({
          ...this.props.location,
          search: searchParams.toString(),
        })
      }
      const reducedFilters = reduceFiltersConfig(
        FILTERS_CONFIG,
        this.props.userPermissions
      )
      this.setState({
        reducedFilters,
      })

      this.props.onInitialLoad()
    },

    componentDidUpdate(prevProps) {
      if (this.props.location.search !== prevProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

const ReportIndex = ({
  intl,
  history,
  location,
  items,
  // --- injected by recompose ---
  onClickDownload,
  onStaticFile,
  reducedFilters,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.reportsTitle)} />
    <NavTitle title={intl.formatMessage(messages.reportsTitle)} />
    {reducedFilters && (
      <BrowseFilters
        history={history}
        location={location}
        intl={intl}
        config={reducedFilters}
      />
    )}
    <Grid container>
      {items.map(report => {
        const externalId = report.get('externalId')
        return (
          <ReportCard
            title={report.get('name')}
            description={report.get('description')}
            onClick={() => onClickDownload(externalId)}
            history={history}
          />
        )
      })}
    </Grid>
    <Grid container>
      <ReportCard
        title="MTB Detected RR Detected"
        description="Contains all MTB Detected/RR Detected cases"
        onClick={() => onStaticFile('MTB_Detected_RR_Detected.xlsx')}
        history={history}
      />
      <ReportCard
        title="Critical Errors By Device"
        description="Includes a list of devices that had at least 2 critical errors"
        onClick={() => onStaticFile('DevicesWithErrors.xlsx')}
        history={history}
      />
      <ReportCard
        title="RIF Resistance Rate (%positive results)"
        description="Listing RIF Resistance Rate for all facilities, ranked highest to lowest."
        onClick={() => onStaticFile('RifResistanceRate.xlsx')}
        history={history}
      />
      <ReportCard
        title="Results with HIV Not Suppressed"
        description="All HIV results where the virus is not suppressed"
        onClick={() => onStaticFile('HIVNotSuppressed.xlsx')}
        history={history}
      />
    </Grid>
  </div>
)

export default enhance(ReportIndex)
