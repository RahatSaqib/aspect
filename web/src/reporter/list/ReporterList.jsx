import flowRight from 'lodash/flowRight'
import classnames from 'classnames/bind'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'

import Immutable from 'immutable'
import { useHistory, useLocation } from 'react-router-dom'
import fromPairs from 'lodash/fromPairs'
import { useQuery, useMutation, queryCache } from 'react-query'
import PropTypeOf from '../../shared/types'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../filter/utils'
import { useAuthState } from '../../Providers/AuthProvider'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import {
  getExportableFile,
  REPORTERS_LIST,
  REPORTERS_LIST_REVOKE_ONE,
} from '../ReporterQueries'
import {
  ReporterDataTable,
  ReporterDataTableHead,
  ReporterDataTableRow,
} from './ReporterDataTable'

import { receiveTableItems, Table } from '../../shared/metaReducers/table'
import { receiveList, Items } from '../../shared/metaReducers/items'

import AspectExportListButton from '../../MigratedComponents/AspectExportListButton'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import messages from './messages'

const cssClasses = classnames.bind(require('./ReporterList.css'))

const getBaseColumns = formatMessage => {
  return Immutable.List([
    {
      key: 'siteName',
      label: formatMessage(messages.siteName),
      sortable: true,
    },
    {
      key: 'totalResults',
      label: formatMessage(messages.totalResults),
      sortable: true,
    },
    {
      key: 'delivered',
      label: formatMessage(messages.delivered),
      sortable: true,
    },
    {
      key: 'requiresTreatment',
      label: formatMessage(messages.requiresTreatment),
      sortable: true,
    },
    {
      key: 'onTreatment',
      label: formatMessage(messages.onTreatment),
      sortable: true,
    },
    {
      key: 'transferred',
      label: formatMessage(messages.transferred),
      sortable: true,
    },
    {
      key: 'notPossible',
      label: formatMessage(messages.notPossible),
      sortable: true,
    },
    {
      key: 'notOnTreatment',
      label: formatMessage(messages.notOnTreatment),
      sortable: true,
    },
  ])
}
const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  { date: true, requiredPermissions: [] },
  { deviceName: true, requiredPermissions: [] },
  { revoked: true, requiredPermissions: [] },
  {
    assayAndResultCategory: true,
    requiredPermissions: ['assay:view'],
  },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'siteName',
    'totalResults',
    'delivered',
    'requiresTreatment',
    'onTreatment',
    'transferred',
    'notPossible',
    'notOnTreatment',
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

export const ReporterListWithProps = ({
  intl,
  history,
  location,
  table,
  columns,
  items,
  onRevokedItem,
  isLoading,
  sortCol,
  sortDir,
  pageAt,
  onExportClick,
  pageSize,
  reducedFilters,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.reportersTitle)} />
    <NavTitle title={intl.formatMessage(messages.reportersTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={reducedFilters}
    />
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!isLoading} />

      <AspectExportListButton
        onExport={onExportClick}
        visible={!items.currentIdList.isEmpty()}
        reportName="Reporters"
      />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      {!items.currentIdList.isEmpty() && (
        <ReporterDataTable
          selectable={false}
          className={cssClasses('ReporterDataTable')}
        >
          <ReporterDataTableHead
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={columns}
          />
          <TableBody>
            {items.currentIdList
              .map(id => items.byId.get(id))
              .map(reporter => (
                <ReporterDataTableRow
                  key={reporter.get('siteId')}
                  intl={intl}
                  reporter={reporter}
                  onRevokedItem={onRevokedItem}
                />
              ))}
          </TableBody>
        </ReporterDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          className={cssClasses('BrowseTablePaginator')}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />
      )}
    </DataTableCard>
  </div>
)

const ReporterList = () => {
  const intl = useIntl()
  const history = useHistory()
  const location = useLocation()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()

  const [items, setItems] = useState(new Items())
  const [table, setTable] = useState(
    new Table({
      sortCol: 'siteName',
      sortDir: 'desc',
      filters: Immutable.fromJS({
        assayId: null,
      }),
      extraColumns: Immutable.List(),
    })
  )
  const [total, setTotal] = useState()
  const [filters, setFilters] = useState()
  const [pagination, setPagination] = useState({})
  const [columns, setColumns] = useState([])

  const { sortCol, sortDir, page, size } = pagination
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  const params = { ...pagination, ...filters }

  const [onRevokedItem, { isLoading: isLoadingRevoke }] = useMutation(
    async ({ id, revoked }) =>
      fetchWrapperForQueries({
        endpoint: `${REPORTERS_LIST_REVOKE_ONE.ENDPOINT}/${id}`,
        method: 'PUT',
        params: { revoked },
      }),
    {
      onSuccess: () => {
        queryCache.invalidateQueries([REPORTERS_LIST.KEY, { params }])
      },
    }
  )

  const { isLoading, isError, data, error } = useQuery(
    [REPORTERS_LIST.KEY, { params }],
    async () =>
      fetchWrapperForQueries({
        endpoint: REPORTERS_LIST.ENDPOINT,
        params,
      })
  )

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
      return
    }

    const sortPage = makeSortPageSelector({
      sortCol: 'siteName',
      sortDir: 'desc',
    })
    const urlSearchParams = new URLSearchParams(location.search)
    const urlFilters = urlSearchParams.get('filters')
      ? new URLSearchParams(urlSearchParams.get('filters'))
      : []
    const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
    setFilters(fromPairs([...urlFilters.entries()]))
    setPagination({ sortCol, sortDir, page: pageAt, size: pageSize })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  useEffect(() => {
    if (data) {
      const { data: list, total: totalItems } = data
      setItems(receiveList(items, Immutable.fromJS(list)))
      setTotal(totalItems)
      setTable(receiveTableItems(table, totalItems))
      setColumns(getBaseColumns(intl.formatMessage))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const onExportClick = formatType => {
    const { sanitized, value: filtersParams } = filtersFromLocation(location)
    if (!sanitized) {
      return getExportableFile(
        filtersParams,
        formatType,
        sortCol,
        sortDir,
        0,
        total,
        'Reporters'
      )
    }
  }

  const baseProps = {
    intl,
    history,
    location,
    isLoading: isLoading || isLoadingRevoke,
    items,
    sortCol,
    sortDir,
    columns,
    reducedFilters,
    onExportClick,
    onRevokedItem,
    table,
    total,
    pageAt: page,
    pageSize: size,
  }

  if (isError) throw new Error(error)

  return <ReporterListWithProps {...baseProps} />
}

ReporterListWithProps.propTypes = {
  intl: PropTypeOf.intl.isRequired,
  history: PropTypeOf.history.isRequired,
  location: PropTypeOf.location.isRequired,
  table: PropTypes.instanceOf(Immutable.Record).isRequired,
  items: PropTypes.instanceOf(Immutable.Record).isRequired,
  sortCol: PropTypes.string.isRequired,
  sortDir: PropTypes.string.isRequired,
  pageAt: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onExportClick: PropTypes.func.isRequired,
  onRevokedItem: PropTypes.func.isRequired,
  columns: PropTypes.instanceOf(Immutable.List).isRequired,
  isLoading: PropTypes.bool.isRequired,
  reducedFilters: PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default ReporterList
