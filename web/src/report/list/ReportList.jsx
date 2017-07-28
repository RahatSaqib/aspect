import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import EmptyList from '../../components/shared/EmptyList'
import TablePaginator from '../../components/shared/TablePaginator'
import BrowseCard from '../../components/shared/BrowseCard'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredReports } from '../ReportRedux'
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

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.report.items,
      table: state.report.table,
    }),
    bindActionCreators.bind(null, {
      fetchListFilteredReports,
      configureListFilter,
    })
  ),
  withHandlers({
    onHeadColumnClick: ({ fetchListFilteredReports, table }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) =>
      fetchListFilteredReports(
        {},
        nextSortCol,
        table.sortCol === nextSortCol
          ? table.sortDir === 'asc' ? 'desc' : 'asc'
          : table.sortDir,
        table.page,
        table.pageSize
      ),
    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { reportId } },
    }) => history.push(`/browse/report/${reportId}`),
    onPageChange: ({ fetchListFilteredReports, table }) => nextPage =>
      fetchListFilteredReports(
        {},
        table.sortCol,
        table.sortDir,
        nextPage,
        table.pageSize
      ),
    onPageSizeChange: ({ fetchListFilteredReports, table }) => nextPageSize =>
      fetchListFilteredReports(
        {},
        table.sortCol,
        table.sortDir,
        0,
        nextPageSize
      ),
  }),
  lifecycle({
    componentWillMount() {
      this.props.configureListFilter({
        contactNameOrEmail: true,
      })
    },

    componentDidMount() {
      this.props.onPageChange(0)
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.listFilter !== nextProps.listFilter) {
        this.props.onPageChange(0)
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
  onHeadColumnClick,
  onRowClick,
  onPageChange,
  onPageSizeChange,
}) =>
  <div className={cssClasses('Container')}>
    <Helmet
      title={intl.formatMessage(messages.reportsTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title={intl.formatMessage(messages.reportsTitle)} />
    <BrowseFilters history={history} location={location} intl={intl} />
    {items.currentIdList.isEmpty() && <EmptyList />}
    {!items.currentIdList.isEmpty() &&
      <BrowseCard>
        <DataTableProgressBar
          mode={table.loading ? 'indeterminate' : 'determinate'}
          disabled={!table.loading}
        />
        <ReportDataTable
          selectable={false}
          className={cssClasses('ReportDataTable')}
        >
          <ReportDataTableHead
            sortColumnKey={table.sortCol}
            sortColumnDir={table.sortDir}
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
                onClick={onRowClick}
                data-report-Id={report.get('id')}
              />
            )}
        </ReportDataTable>
        <TablePaginator
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          page={table.page}
          pageSize={table.pageSize}
          total={table.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </BrowseCard>}
  </div>

export default enhance(ReportList)
