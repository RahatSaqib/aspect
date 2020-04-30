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
  diseaseName: {
    id: 'pages.CasesList.diseaseName',
    defaultMessage: 'Disease',
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
  availableSortCol: [
    'externalId',
    'attendingClinic',
    'patientId',
    'diseaseName',
    'status',
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
      sortCol: 'externalId',
      sortDir: 'desc',
    })
  ),
  connect(
    state => ({
      items: state.case.items,
      table: state.case.table,
      userPermissions: state.user.jwt.permissions,
    }),
    bindActionCreators.bind(null, {
      fetchCases,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchCases,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchCases(filtersParams, sortCol, sortDir, pageAt, pageSize)
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

const messageByI18nKey = _.partial(
  // Explicit declare messageBy[i18nKey] so that the keys are searchable.
  (messageBy, i18nKey) => messageBy[i18nKey] || messageBy.default,
  {
    resultCategoryCopiesMl: (title, intl) =>
      intl.formatMessage(messages.resultCategoryCopiesMl),
    default: _.identity,
  }
)

export const CaseList = ({
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
  onRowClick,
  reducedFilters,
}) => {
  const AddNewButton = requirePermissions({
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
      key: 'diseaseName',
      label: intl.formatMessage(messages.diseaseName),
      sortable: true,
      hiddenOn: 'sm',
    },
    {
      key: 'status',
      label: intl.formatMessage(messages.status),
      sortable: true,
    },
  ]

  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.resultsTitle)} />
      <NavTitle title={intl.formatMessage(messages.resultsTitle)} />
      <BrowseFilters
        history={history}
        location={location}
        intl={intl}
        config={reducedFilters}
        askConfirmationForExport={table.total > 1000}
      />
      <DataTableCard key={`DataTableCard--table-${location.key}`}>
        <DataTableProgressBar disabled={!table.loading} />
        {items.currentIdList.isEmpty() && (
          <BrowseEmptyList history={history} location={location} intl={intl} />
        )}
        {!items.currentIdList.isEmpty() && (
          <CaseDataTable
            selectable={false}
            className={cssClasses('CaseDataTable')}
          >
            <CaseDataTableHead
              history={history}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={Immutable.List(columns)}
            />
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
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

export default enhance(CaseList)
