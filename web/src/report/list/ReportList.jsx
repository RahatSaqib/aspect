import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { fetchReports } from '../ReportRedux'
import {
  ReportDataTable,
  ReportDataTableHead,
  ReportDataTableRow,
} from './ReportDataTable'

const cssClasses = classnames.bind(require('./ReportList.css'))

const messages = defineMessages({
  reportsTitle: {
    id: 'pages.ReportList.title',
    defaultMessage: 'Reports',
  },
  deploymentName: {
    id: 'pages.ReportList.deploymentName',
    defaultMessage: 'Deployment Name',
  },
  moduleSerial: {
    id: 'pages.ReportList.moduleSerial',
    defaultMessage: 'Module Serial',
  },
  dateOfError: {
    id: 'pages.ReportList.dateOfError',
    defaultMessage: 'Date of Error',
  },
  error: {
    id: 'pages.ReportList.error',
    defaultMessage: 'Error',
  },
  totalTestsRun: {
    id: 'pages.ReportList.totalTestsRun',
    defaultMessage: 'Total Tests Run',
  },
  totalErrors: {
    id: 'pages.ReportList.totalErrors',
    defaultMessage: 'Total Errors',
  },
  paginatorStatus: {
    id: 'pages.ReportList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# report}
      other {# reports}
    }`,
  },
})

const FILTERS_CONFIG = [
  {
    contactNameOrEmail: true,
    requiredPermissions: [],
  },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'deploymentName',
    'moduleSerial',
    'dateOfError',
    'error',
    'totalTestsRun',
    'totalErrors',
  ],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const enhance = compose(
  withProps(
    makeSortPageSelector({
      sortCol: 'name',
    })
  ),
  connect(
    state => ({
      items: state.report.items,
      table: state.report.table,
      userPermissions: state.user.jwt.permissions,
    }),
    bindActionCreators.bind(null, {
      fetchReports,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchReports,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchReports(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },
  }),
  lifecycle({
    componentWillMount() {
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
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const ReportList = ({
  intl,
  history,
  location,
  table,
  items,
  // --- injected by recompose ---
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  reducedFilters,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.reportsTitle)} />
    <NavTitle title={intl.formatMessage(messages.reportsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={reducedFilters}
    />
    <DataTableCard>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      {!items.currentIdList.isEmpty() && (
        <ReportDataTable
          selectable={false}
          className={cssClasses('ReportDataTable')}
        >
          <ReportDataTableHead
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'deploymentName',
                label: intl.formatMessage(messages.deploymentName),
                sortable: true,
              },
              {
                key: 'moduleSerial',
                label: intl.formatMessage(messages.moduleSerial),
                sortable: true,
              },
              {
                key: 'dateOfError',
                label: intl.formatMessage(messages.dateOfError),
                sortable: true,
              },
              {
                key: 'error',
                label: intl.formatMessage(messages.error),
                sortable: true,
              },
              {
                key: 'totalTestsRun',
                label: intl.formatMessage(messages.totalTestsRun),
                sortable: true,
              },
              {
                key: 'totalErrors',
                label: intl.formatMessage(messages.totalErrors),
                sortable: true,
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(report => (
              <ReportDataTableRow
                key={report.get('id')}
                intl={intl}
                report={report}
              />
            ))}
        </ReportDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />
      )}
    </DataTableCard>
  </div>
)

export default enhance(ReportList)
