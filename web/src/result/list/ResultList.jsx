import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Card } from 'react-toolbox/lib/card'
import { ProgressBar } from 'react-toolbox/lib/progress_bar'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import EmptyList from '../../components/shared/EmptyList'
import TablePaginator from '../../components/shared/TablePaginator'
import {
  ResultDataTable,
  ResultDataTableHead,
  ResultDataTableRow,
} from '../../result/list/ResultDataTable'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredResults, exportResults } from '../ResultRedux'

const cssClasses = classnames.bind(require('./ResultList.css'))

const messages = defineMessages({
  resultsTitle: {
    id: 'pages.ResultList.title',
    defaultMessage: 'Results',
  },
  endedOn: {
    id: 'pages.ResultList.EndedOn',
    defaultMessage: 'Test Date',
  },
  deviceName: {
    id: 'pages.ResultList.deviceName',
    defaultMessage: 'Device',
  },
  sampleOriginSiteName: {
    id: 'pages.ResultList.sampleOriginSiteName',
    defaultMessage: 'Sample Origin Site',
  },
  sampleId: {
    id: 'pages.ResultList.sampleId',
    defaultMessage: 'Sample ID',
  },
  sampleGroup: {
    id: 'pages.ResultList.sampleGroup',
    defaultMessage: 'Sample Group',
  },
  assayId: {
    id: 'pages.ResultList.assayId',
    defaultMessage: 'Assay',
  },
  patiendId: {
    id: 'pages.ResultList.patiendId',
    defaultMessage: 'Patient ID',
  },
  resultCategoryCopiesMl: {
    id: 'pages.ResultList.resultCategoryHiv',
    defaultMessage: 'HIV',
  },
  nullText: {
    id: 'pages.ResultDetail.nullText',
    defaultMessage: 'N/A',
  },
  paginatorStatus: {
    id: 'pages.ResultList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# result}
      other {# results}
    }`,
  },
})

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.result.items,
      table: state.result.table,
    }),
    bindActionCreators.bind(null, {
      fetchListFilteredResults,
      configureListFilter,
      exportResults,
    })
  ),
  withHandlers({
    onExportClick: ({ exportResults, table }) => (
      formatType,
      receivedExportResponse
    ) =>
      exportResults(
        {},
        formatType,
        table.sortCol,
        table.sortDir,
        table.page,
        table.pageSize,
        receivedExportResponse
      ),
    onHeadColumnClick: ({ fetchListFilteredResults, table }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) =>
      fetchListFilteredResults(
        {},
        nextSortCol,
        table.sortCol === nextSortCol
          ? table.sortDir === 'asc' ? 'desc' : 'asc'
          : table.sortDir,
        table.page,
        table.pageSize
      ),
    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { resultId } },
    }) => history.push(`/browse/result/${resultId}`),
    onPageChange: ({ fetchListFilteredResults, table }) => nextPage =>
      fetchListFilteredResults(
        {},
        table.sortCol,
        table.sortDir,
        nextPage,
        table.pageSize
      ),
    onPageSizeChange: ({ fetchListFilteredResults, table }) => nextPageSize =>
      fetchListFilteredResults(
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
        assayAndResultCategory: true,
        geography: true,
        date: true,
        patientOrResearchId: true,
        sampleId: true,
        sampleGroup: true,
        siteName: true,
        sampleOriginSite: true,
        workflowStatus: true,
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

export const ResultList = ({
  intl,
  history,
  location,
  table,
  items,
  onExportClick,
  onHeadColumnClick,
  onRowClick,
  onPageChange,
  onPageSizeChange,
}) =>
  <div className={cssClasses('Content')}>
    <Helmet
      title={intl.formatMessage(messages.resultsTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title={intl.formatMessage(messages.resultsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      onClickExport={onExportClick}
      askConfirmationForExport={table.total > 1000}
    />
    {items.currentIdList.isEmpty() && <EmptyList />}
    {!items.currentIdList.isEmpty() &&
      <Card className={cssClasses('Card')}>
        <ProgressBar
          mode={table.loadig ? 'indeterminate' : 'determinate'}
          disabled={!table.loading}
          className={cssClasses('ProgressBar')}
          theme={{
            indeterminate: cssClasses('ProgressBar--indeterminate'),
          }}
        />
        <ResultDataTable
          selectable={false}
          className={cssClasses('ResultDataTable')}
        >
          <ResultDataTableHead
            sortColumnKey={table.sortCol}
            sortColumnDir={table.sortDir}
            columns={[
              {
                key: 'endedOn',
                label: intl.formatMessage(messages.endedOn),
                onClick: onHeadColumnClick,
              },
              {
                key: 'deviceName',
                label: intl.formatMessage(messages.deviceName),
                onClick: onHeadColumnClick,
              },
              {
                key: 'sampleOriginSiteName',
                label: intl.formatMessage(messages.sampleOriginSiteName),
                onClick: onHeadColumnClick,
              },
              {
                key: 'sampleId',
                label: intl.formatMessage(messages.sampleId),
                onClick: onHeadColumnClick,
              },
              {
                key: 'sampleGroup',
                label: intl.formatMessage(messages.sampleGroup),
                onClick: onHeadColumnClick,
              },
              {
                key: 'patientId',
                label: intl.formatMessage(messages.patiendId),
                onClick: onHeadColumnClick,
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(result =>
              <ResultDataTableRow
                key={result.get('id')}
                intl={intl}
                result={result}
                onClick={onRowClick}
                data-result-Id={result.get('id')}
              />
            )}
        </ResultDataTable>
        <TablePaginator
          className={cssClasses('TablePaginator')}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          page={table.page}
          pageSize={table.pageSize}
          total={table.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </Card>}
  </div>

export default enhance(ResultList)
