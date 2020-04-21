import classnames from 'classnames/bind'
import _ from 'lodash'
import Immutable from 'immutable'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
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
import BrowseTablePaginator, {
  ALL_KEY,
  PAGE_SIZE_BUTTON_KEYS,
} from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { fetchResults, exportResults } from '../ResultRedux'
import ExportListButton from '../../globals/components/ExportListButton'
import requirePermissions from '../../components/shared/requirePermissions'
import {
  ResultDataTable,
  ResultDataTableHead,
  ResultDataTableRow,
} from './ResultDataTable'
import AspectButton from '../../components/shared/AspectButton'

const cssClasses = classnames.bind(require('./ResultList.css'))

const messages = defineMessages({
  resultsTitle: {
    id: 'pages.ResultList.title',
    defaultMessage: 'Results',
  },
  newResult: {
    id: 'pages.ResultList.newResult',
    defaultMessage: 'New Result',
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
    defaultMessage: 'Sample Collection Site',
  },
  sampleId: {
    id: 'pages.ResultList.sampleId',
    defaultMessage: 'Sample ID',
  },
  errorCode: {
    id: 'pages.ResultList.errorCode',
    defaultMessage: 'Error Code',
  },
  resultText: {
    id: 'pages.ResultList.resultText',
    defaultMessage: 'Result Text',
  },
  resultWorkflowStatus: {
    id: 'pages.ResultList.resultWorkflowStatus',
    defaultMessage: 'Result Workflow Status',
  },
  resultTreatmentStatus: {
    id: 'pages.ResultList.resultTreatmentStatus',
    defaultMessage: 'Treatment',
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

const FILTERS_CONFIG = [
  {
    assayAndResultCategory: true,
    requiredPermissions: ['assay:view', 'assay:admin', 'assay:edit'],
  },
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  { date: true, requiredPermissions: [] },
  { patientOrResearchId: true, requiredPermissions: [] },
  { sampleId: true, requiredPermissions: [] },
  { errorCode: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site:view', 'site:admin', 'site:edit'],
  },
  { sampleOriginSite: true, requiredPermissions: [] },
  { workflowStatus: true, requiredPermissions: [] },
  { treatmentStatus: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'endedOn',
    'deviceName',
    'sampleOriginSiteName',
    'sampleId',
    'errorCode',
    'patientId',
    'resultText',
    'resultWorkflowStatus',
    'treatmentStatusInfo',
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
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const RESULT_PAGE_SIZE_BUTTON_KEYS = _.without(PAGE_SIZE_BUTTON_KEYS, ALL_KEY)

const enhance = compose(
  withProps(
    makeSortPageSelector({
      sortCol: 'endedOn',
      sortDir: 'desc',
    })
  ),
  connect(
    state => ({
      items: state.result.items,
      table: state.result.table,
      userPermissions: state.user.jwt.permissions,
    }),
    bindActionCreators.bind(null, {
      fetchResults,
      exportResults,
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
    onAddNewButtonClick: ({ history }) => {
      history.push('/browse/result/add')
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
          formatType.id,
          sortCol,
          sortDir,
          pageAt,
          pageSize,
          formatType.id,
          'results'
        )
      }
    },

    onRowClick: ({ history }) => ({
      currentTarget: {
        dataset: { resultId },
      },
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
  onAddNewButtonClick,
  onRowClick,
  reducedFilters,
}) => {
  const AddNewButton = requirePermissions({
    permissions: ['result:edit', 'result:admin'],
  })(AspectButton)
  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.resultsTitle)} />
      <NavTitle title={intl.formatMessage(messages.resultsTitle)} />
      <BrowseFilters
        history={history}
        location={location}
        intl={intl}
        config={reducedFilters}
        onClickExport={onExportClick}
        askConfirmationForExport={table.total > 1000}
      >
        <AddNewButton
          type="button"
          color="primary"
          variant="contained"
          browseButton
          onClick={onAddNewButtonClick}
        >
          {intl.formatMessage(messages.newResult)}
        </AddNewButton>
      </BrowseFilters>
      <DataTableCard key={`DataTableCard--table-${location.key}`}>
        <DataTableProgressBar disabled={!table.loading} />
        <ExportListButton
          onExcelClick={onExportClick}
          onCsvClick={onExportClick}
          visible={!items.currentIdList.isEmpty()}
          reportName="Results"
        />
        {items.currentIdList.isEmpty() && (
          <BrowseEmptyList history={history} location={location} intl={intl} />
        )}
        {!items.currentIdList.isEmpty() && (
          <ResultDataTable
            selectable={false}
            className={cssClasses('ResultDataTable')}
          >
            <ResultDataTableHead
              history={history}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={Immutable.List([
                {
                  key: 'endedOn',
                  label: intl.formatMessage(messages.endedOn),
                  sortable: true,
                },
                {
                  key: 'deviceName',
                  label: intl.formatMessage(messages.deviceName),
                  sortable: true,
                  hiddenOn: 'sm',
                },
                {
                  key: 'sampleOriginSiteName',
                  label: intl.formatMessage(messages.sampleOriginSiteName),
                  sortable: true,
                  hiddenOn: 'sm',
                },
                {
                  key: 'sampleId',
                  label: intl.formatMessage(messages.sampleId),
                  sortable: true,
                },
                {
                  key: 'resultText',
                  label: intl.formatMessage(messages.resultText),
                  sortable: true,
                },
                {
                  key: 'errorCode',
                  label: intl.formatMessage(messages.errorCode),
                  sortable: true,
                  hiddenOn: 'md',
                },
                {
                  key: 'resultWorkflowStatus',
                  label: intl.formatMessage(messages.resultWorkflowStatus),
                  sortable: true,
                  hiddenOn: 'sm',
                },
                {
                  key: 'treatmentStatusInfo',
                  label: intl.formatMessage(messages.resultTreatmentStatus),
                  sortable: true,
                  hiddenOn: 'sm',
                },
                {
                  key: 'patientId',
                  label: intl.formatMessage(messages.patiendId),
                  sortable: true,
                  hiddenOn: 'xs',
                },
              ]).concat(
                table.extraColumns.map(column => ({
                  key: column.get('db'),
                  label: messageByI18nKey(column.get('i18nKey'))(
                    column.get('title'),
                    intl
                  ),
                  sortable: true,
                  hiddenOn: 'md',
                }))
              )}
            />
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(result => (
                  <ResultDataTableRow
                    key={result.get('id')}
                    intl={intl}
                    extraColumns={table.extraColumns}
                    result={result}
                    onClick={onRowClick}
                    data-result-id={result.get('id')}
                  />
                ))}
            </TableBody>
          </ResultDataTable>
        )}
        {!items.currentIdList.isEmpty() && (
          <BrowseTablePaginator
            history={history}
            location={location}
            intl={intl}
            timedMessageUsed={sortCol === 'endedOn'}
            paginatorStatus={messages.paginatorStatus}
            total={table.total}
            pageAt={pageAt}
            pageSize={pageSize}
            pageSizeButtonKeys={RESULT_PAGE_SIZE_BUTTON_KEYS}
          />
        )}
      </DataTableCard>
    </div>
  )
}

export default enhance(ResultList)
