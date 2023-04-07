import React, { useState, useEffect } from 'react'
import { TableBody } from '@mui/material'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import filter from 'lodash/filter'
import flowRight from 'lodash/flowRight'
import identity from 'lodash/identity'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import partial from 'lodash/partial'
import without from 'lodash/without'
import { Helmet } from 'react-helmet'
import { useQuery } from 'react-query'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import AspectExportListButton from '../../../components/AspectExportListButton'
import DetailHeader from '../../../components/DetailHeader'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { RESULT_LIST } from '../../../components/QueryFetch/Result'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator, { ALL_KEY, PAGE_SIZE_BUTTON_KEYS } from '../../../oldComponents/BrowseTablePaginator'
import BrowseFilters from '../../../oldComponents/filter/BrowseFilters'
import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { useAuthState } from '../../../providers/AuthProvider'
import { fetchTreatmentStatuses } from '../../../store/ResultTreatmentStatusRedux'
import { receiveListWithSet, Items } from '../../../utils/metaReducers/items'
import { receiveTableItems, Table } from '../../../utils/metaReducers/table'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../utils/selectors/searchParams'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
import getExportableFile from '../ResultQueries'
import messages from './messages'
import { ResultDataTable, ResultDataTableHead, ResultDataTableRow } from './ResultDataTable'
import styles from './ResultList.css'

const cssClasses = classnames.bind(styles)

const getBaseColumns = (extraColumns = [], formatMessage) => {
  return Immutable.List(
    filter(
      [
        { key: 'endedOn', label: formatMessage(messages.endedOn), sortable: true },
        { key: 'deviceName', label: formatMessage(messages.deviceName), sortable: true, hiddenOn: 'xs' },
        {
          key: 'sampleOriginSiteName',
          label: formatMessage(messages.sampleOriginSiteName),
          sortable: true,
          hiddenOn: 'sm',
        },
        { key: 'sampleId', label: formatMessage(messages.sampleId), sortable: true },
        { key: 'assayName', label: formatMessage(messages.assayName), sortable: true },
        { key: 'resultText', label: formatMessage(messages.resultText), sortable: true },
        ...map(extraColumns, column => ({
          key: column?.fieldName,
          label: messageByI18nKey(column?.i18nKey)(column?.title, formatMessage),
          sortable: true,
          hiddenOn: 'md',
        })),
        { key: 'errorCode', label: formatMessage(messages.errorCode), sortable: true, hiddenOn: 'lg' },
        {
          key: 'resultWorkflowStatus',
          label: formatMessage(messages.resultWorkflowStatus),
          sortable: true,
          hiddenOn: 'md',
          auth: ['+reporter'],
        },
        {
          key: 'treatmentStatusInfo',
          label: formatMessage(messages.resultTreatmentStatus),
          sortable: true,
          hiddenOn: 'md',
          auth: ['+reporter'],
        },
        { key: 'patientId', label: formatMessage(messages.patientId), sortable: true, hiddenOn: 'xs' },
      ],
      elem => (extraColumns.length > 0 && elem.key !== 'resultText') || extraColumns.length === 0
    )
  )
}

const FILTERS_CONFIG = [
  { assayAndResultCategory: true, requiredPermissions: ['assay:view'] },
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  { date: true, requiredPermissions: [] },
  { patientOrResearchId: true, requiredPermissions: [] },
  { sampleId: true, requiredPermissions: [] },
  { errorCode: true, requiredPermissions: [] },
  { siteName: true, requiredPermissions: ['site:view'] },
  { reportableSiteName: true, requiredPermissions: ['site:view'] },
  { reportableSiteId: true, requiredPermissions: ['site:view'] },
  { deviceName: true, requiredPermissions: ['device'] },
  { deviceType: true, requiredPermissions: [] },
  { sampleOriginSite: true, requiredPermissions: [] },
  { workflowStatus: true, requiredPermissions: [] },
  { treatmentStatus: true, requiredPermissions: [] },
  { displayResult: true, requiredPermissions: [], isEnabled: dependencies => !!dependencies.showFilterDisplayResult },
  { onlyReportableResults: true, requiredPermissions: ['assay:view'] },
  { onlyDownloadedByReporter: true, requiredPermissions: [] },
  { onlyEverTransferred: true, requiredPermissions: [] },
  { onlyTreatmentRequired: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'endedOn',
    'deviceName',
    'sampleOriginSiteName',
    'sampleId',
    'errorCode',
    'patientId',
    'resultWorkflowStatus',
    'treatmentStatusInfo',
    'resultText',
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
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

const RESULT_PAGE_SIZE_BUTTON_KEYS = without(PAGE_SIZE_BUTTON_KEYS, ALL_KEY)

const messageByI18nKey = partial(
  // Explicit declare messageBy[i18nKey] so that the keys are searchable.
  (messageBy, i18nKey) => messageBy[i18nKey] || messageBy.default,
  {
    resultCategoryCopiesMl: (title, formatMessage) => formatMessage(messages.resultCategoryCopiesMl),
    default: identity,
  }
)

export const ResultListWithProps = ({
  intl,
  // history,
  navigate,
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
  <>
    <DetailHeader name={intl.formatMessage(messages.resultsTitle)} disableBack />
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.resultsTitle)} />
      <DataTableCard key={`DataTableCard--table-Result-list---${location.key}`}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
          <BrowseFilters
            navigate={navigate}
            location={location}
            intl={intl}
            config={reducedFilters}
            askConfirmationForExport={table.total > 1000}
          >
            <AspectExportListButton
              onExport={onExportClick}
              visible={!items.currentIdList.isEmpty()}
              reportName="Results"
              disableExcel
            />
          </BrowseFilters>
        </div>

        {isLoading ? <DataTableProgressBar /> : null}

        {items.currentIdList.isEmpty() ? (
          <BrowseEmptyList navigate={navigate} location={location} />
        ) : (
          <>
            <ResultDataTable className={cssClasses('ResultDataTable')}>
              <ResultDataTableHead
                navigate={navigate}
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
                      onClick={e =>
                        gotoWithReturnUrl(
                          `/browse/result/${e.currentTarget.dataset.resultId || 'add'}`,
                          navigate,
                          location
                        )
                      }
                      data-result-id={result.get('id')}
                      messages={messages}
                    />
                  ))}
              </TableBody>
            </ResultDataTable>
            <BrowseTablePaginator
              navigate={navigate}
              location={location}
              intl={intl}
              timedMessageUsed={sortCol === 'endedOn'}
              paginatorStatus={messages.paginatorStatus}
              total={total}
              pageAt={pageAt}
              pageSize={pageSize}
              pageSizeButtonKeys={RESULT_PAGE_SIZE_BUTTON_KEYS}
            />
          </>
        )}
      </DataTableCard>
    </div>
  </>
)

const ResultList = () => {
  // >>>>>> hooks/ <<<<<<
  const intl = useI18n()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const { userPermissions } = useAuthState()

  // >>>>>> Local state <<<<<<
  const [items, setItems] = useState(new Items())
  const [table, setTable] = useState(
    new Table({
      sortCol: 'endedOn',
      sortDir: 'desc',
      filters: Immutable.fromJS({ sampleId: '', sampleGroup: '', assayId: null }),
      extraColumns: Immutable.List(),
    })
  )
  const [total, setTotal] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState()
  const [pagination, setPagination] = useState({})
  const [columns, setColumns] = useState([])

  // >>>>>> Constants <<<<<<
  const { sortCol, sortDir, page, size } = pagination

  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions, {})
  const params = { ...pagination, ...filters }
  delete params.assayOverride

  // >>>>>> Queries <<<<<<
  const {
    isLoading: tableLoading,
    isError,
    data,
    error,
  } = useQuery(
    [RESULT_LIST.KEY, { params }],
    async () => fetchWrapperForQueries({ endpoint: RESULT_LIST.ENDPOINT, params }),
    { enabled: !isEmpty(params) }
  )

  useEffect(() => dispatch(fetchTreatmentStatuses()), [dispatch])
  useEffect(() => {
    setIsLoading(tableLoading)
  }, [tableLoading])

  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location, {})
    const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(
      searchParams.get('filters') || '',
      {}
    )

    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)
      navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    }

    const sortPage = makeSortPageSelector({ sortCol: 'endedOn', sortDir: 'desc' })
    const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
    setPagination({ sortCol, sortDir, page: pageAt, size: pageSize })
    setFilters(getFilters(filtersParams))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  useEffect(() => {
    const searchParams = new URLSearchParams()
    searchParams.set('filters', new URLSearchParams(location.search).get('filters') || '')
    const filtersParams = new URLSearchParams(searchParams.get('filters'))
    if (!filtersParams.has('displayResult')) {
      filtersParams.set('displayResult', 'actual')
      searchParams.set('filters', filtersParams)
      navigate({ ...location, search: `?${searchParams.toString()}` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // >>>>>> Lifecycles <<<<<<
  useEffect(() => {
    if (data) {
      const { data: list, total: totalItems, extraColumns } = data
      setItems(receiveListWithSet(items, Immutable.fromJS(list)))
      setTotal(totalItems)
      const newTable = receiveTableItems(table, totalItems, extraColumns)
      setTable(newTable)

      setColumns(getBaseColumns(extraColumns, intl.formatMessage))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // >>>>>> Callbacks <<<<<<
  const onExportClick = formatType => {
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      setIsLoading(true)
      return getExportableFile(filtersParams, formatType, sortCol, sortDir, 0, Math.min(total, 50000), 'results')
        .then(response => {
          setIsLoading(false)
          return response
        })
        .catch(error => {
          setIsLoading(false)
          throw error
        })
    }
  }
  const baseProps = {
    intl,
    // history,
    navigate,
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
    pageAt: page,
    pageSize: size,
  }
  if (isError) throw new Error(error)

  return <ResultListWithProps {...baseProps} />
}

export default ResultList
