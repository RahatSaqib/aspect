import React from 'react'
import { Table, TableBody } from '@mui/material'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import flowRight from 'lodash/flowRight'
import without from 'lodash/without'
import { Helmet } from 'react-helmet'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import BrowseTablePaginator, { ALL_KEY, PAGE_SIZE_BUTTON_KEYS } from '../../../oldComponents/BrowseTablePaginator'
import { sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import NavTitle from '../../../oldComponents/NavTitle'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { fetchCases } from '../../../store/CaseRedux'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../utils/selectors/searchParams'
import styles from './CaseList.css'
import CaseTableRow from './CaseTableRow'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  createdOn: {
    id: 'pages.CaseList.createdOn',
    defaultMessage: 'Date',
  },
  resultsTitle: {
    id: 'pages.CaseList.title',
    defaultMessage: 'Cases',
  },
  caseId: {
    id: 'pages.CasesList.caseId',
    defaultMessage: 'Case ID',
  },
  sampleOriginSite: {
    id: 'pages.CasesList.sampleOriginSite',
    defaultMessage: 'Sample Collection Site',
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
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  { patientOrCaseId: true, requiredPermissions: [] },
  { sampleOriginSite: true, requiredPermissions: [] },
  { diseaseId: true, requiredPermissions: [] },
  { onlyDisease: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['createdOn', 'externalId', 'sampleOriginSite', 'patientId', 'diseaseName', 'status', 'diseaseId'],
})

const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

const RESULT_PAGE_SIZE_BUTTON_KEYS = without(PAGE_SIZE_BUTTON_KEYS, ALL_KEY)

const enhance = compose(
  injectIntl,
  withProps(
    makeSortPageSelector({
      sortCol: 'createdOn',
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
    onInitialLoad:
      ({ location, fetchCases, sortCol, sortDir, pageAt, pageSize }) =>
      () => {
        const { sanitized, value: filtersParams } = filtersFromLocation(location)
        if (!sanitized) {
          fetchCases(filtersParams, sortCol, sortDir, pageAt, pageSize)
        }
      },
    onRowClick:
      ({ navigate }) =>
      ({
        currentTarget: {
          dataset: { caseId },
        },
      }) => {
        navigate(`/browse/case/${caseId}`)
      },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(this.props.location)
      const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.navigate(
          {
            ...this.props.location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      }
      const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, this.props.userPermissions)
      this.setState({
        reducedFilters,
      })
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const CaseList = ({
  intl,
  navigate,
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
  const columns = [
    {
      key: 'createdOn',
      label: intl.formatMessage(messages.createdOn),
      sortable: true,
    },
    {
      key: 'externalId',
      label: intl.formatMessage(messages.caseId),
      sortable: true,
    },
    {
      key: 'sampleOriginSite',
      label: intl.formatMessage(messages.sampleOriginSite),
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
      <BrowseFilters config={reducedFilters} askConfirmationForExport={table.total > 1000} />
      <DataTableCard key={`DataTableCard--table-${location.key}`}>
        <DataTableProgressBar disabled={!table.loading} />
        {items.currentIdList.isEmpty() && <BrowseEmptyList navigate={navigate} location={location} />}
        {!items.currentIdList.isEmpty() && (
          <Table className={cssClasses('CaseDataTable')}>
            <DataTableHead
              navigate={navigate}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={Immutable.List(columns)}
            />
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(_case => (
                  <CaseTableRow
                    key={_case.get('id')}
                    intl={intl}
                    _case={_case}
                    onClick={onRowClick}
                    data-case-id={_case.get('id')}
                  />
                ))}
            </TableBody>
          </Table>
        )}
        {!items.currentIdList.isEmpty() && (
          <BrowseTablePaginator
            navigate={navigate}
            location={location}
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
