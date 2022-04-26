import React, { useState, useEffect } from 'react'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import map from 'lodash/map'
import without from 'lodash/without'
import partial from 'lodash/partial'
import filter from 'lodash/filter'
import identity from 'lodash/identity'
import isEmpty from 'lodash/isEmpty'
import Immutable from 'immutable'
import { useIntl } from 'react-intl'
import { useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import { useQuery } from 'react-query'

import getExportableFile from '../ResultQueries'
import { receiveTableItems, Table } from '../../shared/metaReducers/table'
import { receiveListWithSet, Items } from '../../shared/metaReducers/items'
import { gotoWithReturnUrl } from '../../shared/utils/browser'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import {
  getFilters,
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
import { useAuthState } from '../../Providers/AuthProvider'
import messages from './messages'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import { RESULT_LIST } from '../../MigratedComponents/QueryFetch/Result'
import { i18nWrapper } from '../../Providers/I18nProvider'

import styles from './ResultList.css'

const cssClasses = classnames.bind(styles)

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
    reportableSiteName: true,
    requiredPermissions: ['site:view'],
  },
  {
    reportableSiteId: true,
    requiredPermissions: ['site:view'],
  },
  {
    deviceName: true,
    requiredPermissions: ['device'],
  },
  {
    deviceType: true,
    requiredPermissions: [],
  },
  { sampleOriginSite: true, requiredPermissions: [] },
  { workflowStatus: true, requiredPermissions: [] },
  { treatmentStatus: true, requiredPermissions: [] },
  {
    onlyReportableResults: true,
    requiredPermissions: ['assay:view'],
  },
  {
    onlyDownloadedByReporter: true,
    requiredPermissions: [],
  },
  {
    onlyEverTransferred: true,
    requiredPermissions: [],
  },
  { onlyTreatmentRequired: true, requiredPermissions: [] },
]

// eslint-disable-next-line no-unused-vars
const AddNewButton = requirePermissions({
  permissions: ['result:edit'],
})(AspectButton)

const onRowClick =
  (navigate, location) =>
  ({
    currentTarget: {
      dataset: { resultId },
    },
  }) => {
    gotoResultDetails(navigate, location, resultId)
  }

const gotoResultDetails = (navigate, location, resultId) => {
  const url = `/browse/result/${resultId || 'add'}`
  gotoWithReturnUrl(url, navigate, location)
}

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
    resultCategoryCopiesMl: (title, formatMessage) =>
      formatMessage(messages.resultCategoryCopiesMl),
    default: identity,
  }
)

const getBaseColumns = (extraColumns = []) => {
  const { formatMessage } = i18nWrapper()
  return Immutable.List(
    filter(
      [
        {
          key: 'endedOn',
          label: formatMessage(messages.endedOn),
          sortable: true,
        },
        {
          key: 'deviceName',
          label: formatMessage(messages.deviceName),
          sortable: true,
          hiddenOn: 'xs',
        },
        {
          key: 'sampleOriginSiteName',
          label: formatMessage(messages.sampleOriginSiteName),
          sortable: true,
          hiddenOn: 'sm',
        },
        {
          key: 'sampleId',
          label: formatMessage(messages.sampleId),
          sortable: true,
        },
        {
          key: 'assayName',
          label: formatMessage(messages.assayName),
          sortable: true,
        },
        {
          key: 'resultText',
          label: formatMessage(messages.resultText),
          sortable: true,
        },
        ...map(extraColumns, column => ({
          key: column?.fieldName,
          label: messageByI18nKey(column?.i18nKey)(
            column?.title,
            formatMessage
          ),
          sortable: true,
          hiddenOn: 'md',
        })),
        {
          key: 'errorCode',
          label: formatMessage(messages.errorCode),
          sortable: true,
          hiddenOn: 'lg',
        },
        {
          key: 'resultWorkflowStatus',
          label: formatMessage(messages.resultWorkflowStatus),
          sortable: true,
          hiddenOn: 'md',
        },
        {
          key: 'treatmentStatusInfo',
          label: formatMessage(messages.resultTreatmentStatus),
          sortable: true,
          hiddenOn: 'md',
        },
        {
          key: 'patientId',
          label: formatMessage(messages.patientId),
          sortable: true,
          hiddenOn: 'xs',
        },
      ],
      elem =>
        (extraColumns.length > 0 && elem.key !== 'resultText') ||
        extraColumns.length === 0
    )
  )
}
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
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.resultsTitle)} />
    <NavTitle title={intl.formatMessage(messages.resultsTitle)} />
    <BrowseFilters
      navigate={navigate}
      location={location}
      intl={intl}
      config={reducedFilters}
      askConfirmationForExport={table.total > 1000}
    />
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!isLoading} />

      <AspectExportListButton
        onExport={onExportClick}
        visible={!items.currentIdList.isEmpty()}
        reportName="Results"
        disableExcel
      />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList navigate={navigate} location={location} />
      )}
      {!items.currentIdList.isEmpty() && (
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
                  onClick={onRowClick(navigate, location)}
                  data-result-id={result.get('id')}
                  messages={messages}
                />
              ))}
          </TableBody>
        </ResultDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
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
      )}
    </DataTableCard>
  </div>
)

const ResultList = () => {
  // >>>>>> Hooks <<<<<<
  const intl = useIntl()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()

  // >>>>>> Local state <<<<<<
  const [items, setItems] = useState(new Items())
  const [table, setTable] = useState(
    new Table({
      sortCol: 'endedOn',
      sortDir: 'desc',
      filters: Immutable.fromJS({
        sampleId: '',
        sampleGroup: '',
        assayId: null,
      }),
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

  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
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
    async () =>
      fetchWrapperForQueries({
        endpoint: RESULT_LIST.ENDPOINT,
        params,
      }),
    { enabled: !isEmpty(params) }
  )

  useEffect(() => {
    setIsLoading(tableLoading)
  }, [tableLoading])
  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    const { sanitized: filtersSanitized, value: filtersParams } =
      filtersSanitizer(searchParams.get('filters') || '')

    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)
      navigate(
        {
          ...location,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      )
    }

    const sortPage = makeSortPageSelector({
      sortCol: 'endedOn',
      sortDir: 'desc',
    })
    const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
    setPagination({ sortCol, sortDir, page: pageAt, size: pageSize })
    setFilters(getFilters(filtersParams))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  // >>>>>> Lifecycles <<<<<<
  useEffect(() => {
    if (data) {
      const { data: list, total: totalItems, extraColumns } = data
      setItems(receiveListWithSet(items, Immutable.fromJS(list)))
      setTotal(totalItems)
      const newTable = receiveTableItems(table, totalItems, extraColumns)
      setTable(newTable)

      setColumns(getBaseColumns(extraColumns))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // >>>>>> Callbacks <<<<<<
  const onExportClick = formatType => {
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      setIsLoading(true)
      return getExportableFile(
        filtersParams,
        formatType,
        sortCol,
        sortDir,
        0,
        Math.min(total, 50000),
        'results'
      )
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
