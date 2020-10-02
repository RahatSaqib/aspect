import React, { useCallback, useMemo, useState, useEffect } from 'react'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import without from 'lodash/without'
import partial from 'lodash/partial'
import identity from 'lodash/identity'
import Immutable from 'immutable'
import { useIntl } from 'react-intl'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import fromPairs from 'lodash/fromPairs'
import { useQuery } from 'react-query'

import getExportableFile from '../ResultQueries'
import { receiveTableItems, Table } from '../../shared/metaReducers/table'
import { receiveList, Items } from '../../shared/metaReducers/items'
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
import AspectExportListButton from '../../MigratedComponents/AspectExportListButton'
import requirePermissions from '../../components/shared/requirePermissions'
import {
  ResultDataTable,
  ResultDataTableHead,
  ResultDataTableRow,
} from './ResultDataTable'
import AspectButton from '../../components/shared/AspectButton'
import messages from './messages'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { RESULT_LIST } from '../../MigratedComponents/QueryFetch/Result'

const cssClasses = classnames.bind(require('./ResultList.css'))

const FILTERS_CONFIG = [
  {
    assayAndResultCategory: true,
    requiredPermissions: ['assay:view'],
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
    requiredPermissions: ['site:view'],
  },
  {
    deviceName: true,
    requiredPermissions: ['device'],
  },
  { sampleOriginSite: true, requiredPermissions: [] },
  { workflowStatus: true, requiredPermissions: [] },
  { treatmentStatus: true, requiredPermissions: [] },
]

const AddNewButton = requirePermissions({
  permissions: ['result:edit'],
})(AspectButton)

const onAddNewButtonClick = ({ history }) => () =>
  history.push('/browse/result/add')

const onRowClick = ({ history }) => ({
  currentTarget: {
    dataset: { resultId },
  },
}) => history.push(`/browse/result/${resultId}`)

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
    'assayName',
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
  flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const RESULT_PAGE_SIZE_BUTTON_KEYS = without(PAGE_SIZE_BUTTON_KEYS, ALL_KEY)

const messageByI18nKey = partial(
  // Explicit declare messageBy[i18nKey] so that the keys are searchable.
  (messageBy, i18nKey) => messageBy[i18nKey] || messageBy.default,
  {
    resultCategoryCopiesMl: (title, intl) =>
      intl.formatMessage(messages.resultCategoryCopiesMl),
    default: identity,
  }
)

const getBaseColumns = intl => {
  return Immutable.List([
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
      key: 'assayName',
      label: intl.formatMessage(messages.assayName),
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
  ])
}

export const ResultListWithProps = ({
  intl,
  history,
  location,
  isLoading,
  items,
  sortCol,
  sortDir,
  columns,
  reducedFilters,
  onExportClick,
  table,
  total,
  pageAt,
  pageSize,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.resultsTitle)} />
    <NavTitle title={intl.formatMessage(messages.resultsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={reducedFilters}
      askConfirmationForExport={table.total > 1000}
    >
      <AddNewButton
        type="button"
        color="primary"
        variant="contained"
        browseButton
        onClick={onAddNewButtonClick({ history })}
      >
        {intl.formatMessage(messages.newResult)}
      </AddNewButton>
    </BrowseFilters>
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!isLoading} />

      <AspectExportListButton
        onExport={onExportClick}
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
            columns={columns}
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
                  onClick={onRowClick({ history })}
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
          total={total}
          pageAt={pageAt}
          pageSize={pageSize}
          pageSizeButtonKeys={RESULT_PAGE_SIZE_BUTTON_KEYS}
        />
      )}
    </DataTableCard>
  </div>
)

const emptyData = {
  data: [],
  total: 0,
  extraColumns: [],
}
const initialItems = new Items()
const initialTable = new Table({
  sortCol: 'endedOn',
  sortDir: 'desc',
  filters: Immutable.fromJS({
    sampleId: '',
    sampleGroup: '',
    assayId: null,
  }),
  extraColumns: Immutable.List(),
})

const ResultList = () => {
  // >>>>>> Hooks <<<<<<
  const intl = useIntl()
  const history = useHistory()
  const location = useLocation()
  const userPermissions = useSelector(state => state.user.jwt.permissions)

  // >>>>>> Local state <<<<<<
  const [filters, setFilters] = useState()
  const [pagination, setPagination] = useState({})

  // >>>>>> Constants <<<<<<
  const { sortCol, sortDir, page, size } = pagination
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  const params = { ...pagination, ...filters }

  // >>>>>> Queries <<<<<<
  const { isLoading, isError, data = emptyData, error } = useQuery(
    [RESULT_LIST.KEY, { params }],
    async () =>
      fetchWrapperForQueries({
        endpoint: RESULT_LIST.ENDPOINT,
        params,
      })
  )

  /**
   * cache normalized 'items' and 'table'
   */
  const items = useMemo(
    () => receiveList(initialItems, Immutable.fromJS(data.data)),
    [data]
  )
  const table = useMemo(
    () => receiveTableItems(initialTable, data.total, data.extraColumns),
    [data]
  )

  /**
   * define 'filters' and 'pagination'
   */
  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    const {
      sanitized: filtersSanitized,
      value: filtersParams,
    } = filtersSanitizer(searchParams.get('filters') || '')

    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)
      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    }

    const sortPage = makeSortPageSelector({
      sortCol: 'endedOn',
    })
    const urlSearchParams = new URLSearchParams(location.search)
    const urlFilters = urlSearchParams.get('filters')
      ? new URLSearchParams(urlSearchParams.get('filters'))
      : []
    const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
    setFilters(fromPairs([...urlFilters.entries()]))
    setPagination({ sortCol, sortDir, page: pageAt, size: pageSize })
  }, [location, table])

  // >>>>>> Callbacks <<<<<<
  const onExportClick = formatType => {
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      return getExportableFile(
        filtersParams,
        formatType,
        sortCol,
        sortDir,
        page,
        size,
        'results'
      )
    }
  }

  const columns = getBaseColumns(intl).concat(
    table.extraColumns.map(column => ({
      key: column.get('db'),
      label: messageByI18nKey(column.get('i18nKey'))(column.get('title'), intl),
      sortable: true,
      hiddenOn: 'md',
    }))
  )

  const baseProps = {
    intl,
    history,
    location,
    isLoading,
    items,
    sortCol,
    sortDir,
    columns,
    reducedFilters,
    onExportClick,
    table,
    total: data.total,
    pageAt: page,
    pageSize: size,
  }

  if (isError) throw new Error(error)

  return <ResultListWithProps {...baseProps} />
}

export default ResultList
