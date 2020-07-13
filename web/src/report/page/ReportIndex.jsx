import _ from 'lodash'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
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
    requiredPermissions: ['site:view'],
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
  injectIntl,
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
        showBrowseDropdown={false}
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
  </div>
)

export default enhance(ReportIndex)
