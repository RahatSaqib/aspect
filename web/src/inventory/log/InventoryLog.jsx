import classnames from 'classnames/bind'
import React, { useEffect } from 'react'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import PropTypes from 'prop-types'
import { useAuthState } from '../../Providers/AuthProvider'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
} from '../../shared/selectors/searchParams'
import {
  getFilters,
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import {
  InventoryLogDataTable,
  InventoryLogDataTableHead,
  InventoryLogTableRow,
} from './InventoryLogDataTable'
import { INVENTORY_LOG } from '../../MigratedComponents/QueryFetch/Inventory'
import messages from './messages'
import styles from './InventoryLog.css'

const cssClasses = classnames.bind(styles)

const FILTERS_CONFIG = [
  { consumable: true, requiredPermissions: [] },
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site:view'],
  },
  {
    date: true,
    requiredPermissions: [],
  },
  // {
  //   lotNumber: true,
  //   requiredPermissions: [],
  //   isEnabled: dependencies => dependencies.breakOutByLot,
  // },
]

const availableSortCol = [
  'createdOn',
  'siteName',
  'lotNumber',
  'consumableName',
  'movementReason',
  'expiresOn',
  'quantity',
  'notes',
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol,
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)

export const InventoryLogWithProps = ({
  intl,
  navigate,
  location,
  reducedFilters,
  isLoading,
  data,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
}) => {
  const columns = [
    {
      key: 'createdOn',
      label: intl.formatMessage(messages.date),
      sortable: true,
    },
    {
      key: 'siteName',
      label: intl.formatMessage(messages.siteName),
      sortable: true,
    },
    {
      key: 'consumableName',
      label: intl.formatMessage(messages.consumableName),
      sortable: true,
    },
    {
      key: 'lotNumber',
      label: intl.formatMessage(messages.lotNumber),
      sortable: true,
    },
    {
      key: 'expiresOn',
      label: intl.formatMessage(messages.expiresOn),
      sortable: true,
    },
    {
      key: 'quantity',
      label: intl.formatMessage(messages.quantity),
      sortable: true,
    },
    {
      key: 'movementReason',
      label: intl.formatMessage(messages.reason),
      sortable: true,
    },
    {
      key: 'notes',
      label: intl.formatMessage(messages.notes),
      sortable: true,
    },
  ]
  const { data: items, total } = data || { data: null }
  const hasItems = items && items.length > 0
  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.inventoryLogTitle)} />
      <NavTitle title={intl.formatMessage(messages.inventoryLogTitle)} />
      <BrowseFilters
        navigate={navigate}
        location={location}
        intl={intl}
        config={reducedFilters}
        dateFilterLabel={intl.formatMessage(messages.date)}
      />
      <DataTableCard
        key={`DataTableCard--table-${location.key}`}
        className={cssClasses('DataTableCard--table')}
      >
        <DataTableProgressBar disabled={!isLoading} />
        {!hasItems && (
          <BrowseEmptyList navigate={navigate} location={location} />
        )}
        {hasItems && (
          <InventoryLogDataTable className={cssClasses('InventoryDataTable')}>
            <InventoryLogDataTableHead
              navigate={navigate}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={columns}
            />
            <TableBody>
              {items.map(inventoryLogItem => (
                <InventoryLogTableRow
                  key={inventoryLogItem.id}
                  inventoryLogItem={inventoryLogItem}
                />
              ))}
            </TableBody>
          </InventoryLogDataTable>
        )}
        {hasItems && (
          <BrowseTablePaginator
            navigate={navigate}
            location={location}
            intl={intl}
            paginatorStatus={messages.paginatorStatus}
            total={total}
            pageAt={pageAt}
            pageSize={pageSize}
          />
        )}
      </DataTableCard>{' '}
    </div>
  )
}

const InventoryLog = ({ navigate, location }) => {
  // >>>>>> Defining hooks <<<<<<
  const intl = useIntl()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()

  // >>>>>> Structuring data <<<<<<
  const sortPage = makeSortPageSelector({
    sortCol: 'siteName',
  })
  const reducedFilters = reduceFiltersConfig(
    FILTERS_CONFIG,
    userPermissions,
    {}
  )
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({
    location,
    availableSortCol,
    dependencies: {},
  })
  const { value: searchParams } = searchSanitizer(location, {})
  const { value: filtersParams } = filtersSanitizer(
    searchParams.get('filters') || '',
    {}
  )
  const filters = getFilters(filtersParams)

  // >>>>>> Defining queries <<<<<<
  const params = {
    sortCol,
    sortDir,
    page: pageAt,
    size: pageSize,
    ...filters,
  }

  const {
    isError,
    isLoading,
    data = false,
    error,
  } = useQuery([INVENTORY_LOG.KEY, params, filters], async () =>
    fetchWrapperForQueries({ endpoint: INVENTORY_LOG.ENDPOINT, params })
  )

  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location, {})
    const { sanitized: filtersSanitized, value: filtersParams } =
      filtersSanitizer(searchParams.get('filters') || '', {})
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
  }, [location, navigate])

  if (isError) throw new Error(error)

  const props = {
    intl,
    navigate,
    location,
    reducedFilters,
    isLoading,
    data,
    sortCol,
    sortDir,
    pageAt,
    pageSize,
  }

  return <InventoryLogWithProps {...props} />
}

InventoryLog.propTypes = {
  navigate: PropTypes.oneOfType([PropTypes.func]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default InventoryLog
