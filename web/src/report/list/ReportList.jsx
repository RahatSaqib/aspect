import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'
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

const FILTERS_CONFIG = {
  contactNameOrEmail: true,
}

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
  _.flowRight(filtersSanitizer, searchParams => searchParams.get('filters')),
  searchSanitizer
)

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      items: state.report.items,
      table: state.report.table,
    }),
    bindActionCreators.bind(null, {
      fetchReports,
    })
  ),
  withProps(
    makeSortPageSelector({
      sortCol: 'name',
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

    onHeadColumnClick: ({ history, location, sortCol, sortDir }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) => {
      const searchParams = new URLSearchParams(location.search)

      if (sortCol !== nextSortCol) {
        searchParams.set('sortCol', nextSortCol)
      } else {
        searchParams.set('sortDir', sortDir !== 'asc' ? 'asc' : 'desc')
      }

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
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
      } = filtersSanitizer(searchParams.get('filters'))
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.history.replace({
          ...this.props.location,
          search: searchParams.toString(),
        })
      }
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
  onHeadColumnClick,
}) =>
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.reportsTitle)} />
    <NavTitle title={intl.formatMessage(messages.reportsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={FILTERS_CONFIG}
    />
    <DataTableCard>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() &&
        <BrowseEmptyList history={history} location={location} intl={intl} />}
      {!items.currentIdList.isEmpty() &&
        <ReportDataTable
          selectable={false}
          className={cssClasses('ReportDataTable')}
        >
          <ReportDataTableHead
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'deploymentName',
                label: intl.formatMessage(messages.deploymentName),
                onClick: onHeadColumnClick,
              },
              {
                key: 'moduleSerial',
                label: intl.formatMessage(messages.moduleSerial),
                onClick: onHeadColumnClick,
              },
              {
                key: 'dateOfError',
                label: intl.formatMessage(messages.dateOfError),
                onClick: onHeadColumnClick,
              },
              {
                key: 'error',
                label: intl.formatMessage(messages.error),
                onClick: onHeadColumnClick,
              },
              {
                key: 'totalTestsRun',
                label: intl.formatMessage(messages.totalTestsRun),
                onClick: onHeadColumnClick,
              },
              {
                key: 'totalErrors',
                label: intl.formatMessage(messages.totalErrors),
                onClick: onHeadColumnClick,
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(report =>
              <ReportDataTableRow
                key={report.get('id')}
                intl={intl}
                report={report}
              />
            )}
        </ReportDataTable>}
      {!items.currentIdList.isEmpty() &&
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />}
    </DataTableCard>
  </div>

export default enhance(ReportList)
