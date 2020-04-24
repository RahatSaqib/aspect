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
import { fetchCases } from '../CaseRedux'
import ExportListButton from '../../globals/components/ExportListButton'
import requirePermissions from '../../components/shared/requirePermissions'
import {
  CaseDataTable,
  CaseDataTableHead,
  CaseDataTableRow,
} from './CaseDataTable'
import AspectButton from '../../components/shared/AspectButton'

const cssClasses = classnames.bind(require('./CaseList.css'))

const messages = defineMessages({
  resultsTitle: {
    id: 'pages.CaseList.title',
    defaultMessage: 'Cases',
  },
  code: {
    id: 'pages.CasesList.code',
    defaultMessage: 'Code',
  },
  attendingClinic: {
    id: 'pages.CasesList.attendingClinic',
    defaultMessage: 'Attending Clinic',
  },
  status: {
    id: 'pages.CasesList.status',
    defaultMessage: 'Status',
  },
  patientId: {
    id: 'pages.CasesList.patientId',
    defaultMessage: 'Patient ID',
  },
  paginatorStatus: {
    id: 'pages.CaseList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# case}
      other {# cases}
    }`,
  },
})

const FILTERS_CONFIG = [
<<<<<<< HEAD
  // {
  //   assayAndResultCategory: true,
  //   requiredPermissions: ['assay:view', 'assay:admin', 'assay:edit'],
  // },
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  // { date: true, requiredPermissions: [] },
  { patientOrResearchId: true, requiredPermissions: [] },
  // { sampleId: true, requiredPermissions: [] },
  // { errorCode: true, requiredPermissions: [] },
  // {
  //   siteName: true,
  //   requiredPermissions: ['site:view', 'site:admin', 'site:edit'],
  // },
  { sampleOriginSite: true, requiredPermissions: [] },
  // { workflowStatus: true, requiredPermissions: [] },
  // { treatmentStatus: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['externalId', 'attendingClinic', 'patientId', 'status'],
=======
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
>>>>>>> Created files for case listing
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
<<<<<<< HEAD
      sortCol: 'externalId',
=======
      sortCol: 'endedOn',
>>>>>>> Created files for case listing
      sortDir: 'desc',
    })
  ),
  connect(
    state => ({
<<<<<<< HEAD
      items: state.case.items,
      table: state.case.table,
      userPermissions: state.user.jwt.permissions,
    }),
    bindActionCreators.bind(null, {
      fetchCases,
=======
      items: state.result.items,
      table: state.result.table,
      userPermissions: state.user.jwt.permissions,
    }),
    bindActionCreators.bind(null, {
      fetchResults,
      exportResults,
>>>>>>> Created files for case listing
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
<<<<<<< HEAD
      fetchCases,
=======
      fetchResults,
>>>>>>> Created files for case listing
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
<<<<<<< HEAD
        fetchCases(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },
=======
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
>>>>>>> Created files for case listing
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

<<<<<<< HEAD
export const CaseList = ({
=======
export const ResultList = ({
>>>>>>> Created files for case listing
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
<<<<<<< HEAD
=======
  onExportClick,
  onAddNewButtonClick,
>>>>>>> Created files for case listing
  onRowClick,
  reducedFilters,
}) => {
  const AddNewButton = requirePermissions({
<<<<<<< HEAD
    permissions: ['case:edit', 'case:admin'],
  })(AspectButton)

  const columns = [
    {
      key: 'code',
      label: intl.formatMessage(messages.code),
      sortable: true,
    },
    {
      key: 'attendingClinic',
      label: intl.formatMessage(messages.attendingClinic),
      sortable: true,
      hiddenOn: 'sm',
    },
    {
      key: 'patientId',
      label: intl.formatMessage(messages.patientId),
      sortable: true,
      hiddenOn: 'sm',
    },
    {
      key: 'status',
      label: intl.formatMessage(messages.status),
      sortable: true,
    },
  ]

=======
    permissions: ['result:edit', 'result:admin'],
  })(AspectButton)
>>>>>>> Created files for case listing
  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.resultsTitle)} />
      <NavTitle title={intl.formatMessage(messages.resultsTitle)} />
      <BrowseFilters
        history={history}
        location={location}
        intl={intl}
        config={reducedFilters}
<<<<<<< HEAD
        askConfirmationForExport={table.total > 1000}
      />
      <DataTableCard key={`DataTableCard--table-${location.key}`}>
        <DataTableProgressBar disabled={!table.loading} />
=======
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
>>>>>>> Created files for case listing
        {items.currentIdList.isEmpty() && (
          <BrowseEmptyList history={history} location={location} intl={intl} />
        )}
        {!items.currentIdList.isEmpty() && (
<<<<<<< HEAD
          <CaseDataTable
            selectable={false}
            className={cssClasses('CaseDataTable')}
          >
            <CaseDataTableHead
=======
          <ResultDataTable
            selectable={false}
            className={cssClasses('ResultDataTable')}
          >
            <ResultDataTableHead
>>>>>>> Created files for case listing
              history={history}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
<<<<<<< HEAD
              columns={Immutable.List(columns)}
=======
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
>>>>>>> Created files for case listing
            />
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
<<<<<<< HEAD
                .map(_case => (
                  <CaseDataTableRow
                    key={_case.get('id')}
                    intl={intl}
                    _case={_case}
                    onClick={onRowClick}
                    data-result-id={_case.get('id')}
                  />
                ))}
            </TableBody>
          </CaseDataTable>
=======
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
>>>>>>> Created files for case listing
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

<<<<<<< HEAD
export default enhance(CaseList)
=======
export default enhance(ResultList)
>>>>>>> Created files for case listing
