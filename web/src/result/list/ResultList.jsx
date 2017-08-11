import classnames from 'classnames/bind'
import _ from 'lodash'
import Immutable from 'immutable'
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
import { fetchResults, exportResults } from '../ResultRedux'
import {
  ResultDataTable,
  ResultDataTableHead,
  ResultDataTableRow,
} from './ResultDataTable'

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
  resultText: {
    id: 'pages.ResultList.resultText',
    defaultMessage: 'Result Text',
  },
  resultWorkflowStatus: {
    id: 'pages.ResultList.resultWorkflowStatus',
    defaultMessage: 'Result Workflow Status',
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
  paginatorStatus: {
    id: 'pages.ResultList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# result}
      other {# results}
    }`,
  },
})

const FILTERS_CONFIG = {
  assayAndResultCategory: true,
  geography: true,
  state: true,
  lga: true,
  date: true,
  patientOrResearchId: true,
  sampleId: true,
  sampleGroup: true,
  siteName: true,
  sampleOriginSite: true,
  workflowStatus: true,
}

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'endedOn',
    'deviceName',
    'sampleOriginSiteName',
    'sampleId',
    'sampleGroup',
    'patientId',
    /* --- table.extraColumns BEGIN --- */
    'resultCategory1Name',
    'resultCategory2Name',
    'count',
    'copies',
    /* --- table.extraColumns END --- */
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
      items: state.result.items,
      table: state.result.table,
    }),
    bindActionCreators.bind(null, {
      fetchResults,
      exportResults,
    })
  ),
  withProps(
    makeSortPageSelector({
      sortCol: 'endedOn',
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchResults,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchResults(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },

    onExportClick: ({
      location,
      exportResults,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => formatType => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportResults(
          filtersParams,
          formatType,
          sortCol,
          sortDir,
          pageAt,
          pageSize
        )
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

    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { resultId } },
    }) => history.push(`/browse/result/${resultId}`),
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

const messageByI18nKey = _.partial(
  // Explicit declare messageBy[i18nKey] so that the keys are searchable.
  (messageBy, i18nKey) => messageBy[i18nKey] || messageBy.default,
  {
    resultCategoryCopiesMl: (title, intl) =>
      intl.formatMessage(messages.resultCategoryCopiesMl),
    default: _.identity,
  }
)

export const ResultList = ({
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
  onExportClick,
  onHeadColumnClick,
  onRowClick,
}) =>
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.resultsTitle)} />
    <NavTitle title={intl.formatMessage(messages.resultsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={FILTERS_CONFIG}
      onClickExport={onExportClick}
      askConfirmationForExport={table.total > 1000}
    />
    <DataTableCard>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() &&
        <BrowseEmptyList history={history} location={location} intl={intl} />}
      {!items.currentIdList.isEmpty() &&
        <ResultDataTable
          selectable={false}
          className={cssClasses('ResultDataTable')}
        >
          <ResultDataTableHead
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={Immutable.List([
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
                key: 'resultText',
                label: intl.formatMessage(messages.resultText),
                onClick: onHeadColumnClick,
              },
              {
                key: 'resultWorkflowStatus',
                label: intl.formatMessage(messages.resultWorkflowStatus),
                onClick: onHeadColumnClick,
              },
              {
                key: 'patientId',
                label: intl.formatMessage(messages.patiendId),
                onClick: onHeadColumnClick,
              },
            ]).concat(
              table.extraColumns.map(column => ({
                key: column.get('db'),
                label: messageByI18nKey(column.get('i18nKey'))(
                  column.get('title'),
                  intl
                ),
                onClick: onHeadColumnClick,
              }))
            )}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(result =>
              <ResultDataTableRow
                key={result.get('id')}
                intl={intl}
                extraColumns={table.extraColumns}
                result={result}
                onClick={onRowClick}
                data-result-Id={result.get('id')}
              />
            )}
        </ResultDataTable>}
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

export default enhance(ResultList)
