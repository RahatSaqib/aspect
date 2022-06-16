import flowRight from 'lodash/flowRight'
import classnames from 'classnames/bind'
import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import { useAuthState } from '../../Providers/AuthProvider'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
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
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import ExportListButton from '../../globals/components/ExportListButton'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { exportSupplies, receiveInventoryItems } from '../InventoryRedux'
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
  {
    lotNumber: true,
    requiredPermissions: [],
    isEnabled: dependencies => dependencies.breakOutByLot,
  },
]

const availableSortCol = [
  'siteName',
  'consumableName',
  'quantityOnHand',
  { col: 'expiresOn', isEnabled: dependencies => dependencies.breakOutByLot },
  { col: 'lotNumber', isEnabled: dependencies => dependencies.breakOutByLot },
  {
    col: 'daysStockLeft',
    isEnabled: dependencies => !dependencies.breakOutByLot,
  },
  {
    col: 'projectedWaste',
    isEnabled: dependencies => !dependencies.breakOutByLot,
  },
  {
    col: 'dailyConsumptionRate',
    isEnabled: dependencies => !dependencies.breakOutByLot,
  },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol,
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

export const InventoryLogWithProps = ({
  intl,
  navigate,
  location,
  reducedFilters,
  isLoading,
  onExcelClick,
  items,
  sortCol,
  sortDir,
  table,
  pageAt,
  pageSize,
}) => {
  const columns = [
    {
      key: 'date',
      label: intl.formatMessage(messages.date),
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
      key: 'expirationDate',
      label: intl.formatMessage(messages.expiresOn),
      sortable: true,
    },
    {
      key: 'siteName',
      label: intl.formatMessage(messages.siteName),
      sortable: true,
    },
    {
      key: 'quantity',
      label: intl.formatMessage(messages.quantity),
      sortable: true,
    },
    {
      key: 'consumableReason',
      label: intl.formatMessage(messages.reason),
      sortable: false,
    },
    {
      key: 'notes',
      label: intl.formatMessage(messages.notes),
      sortable: false,
    },
  ]

  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.inventoryItemsTitle)} />
      <NavTitle title={intl.formatMessage(messages.inventoryItemsTitle)} />
      <BrowseFilters
        navigate={navigate}
        location={location}
        intl={intl}
        config={reducedFilters}
        dateFilterLabel={intl.formatMessage(messages.expiresOn)}
      >
        {/* <PermissionsProvider permissions={['inventory:edit']} />{' '} */}
      </BrowseFilters>
      <DataTableCard
        key={`DataTableCard--table-${location.key}`}
        className={cssClasses('DataTableCard--table')}
      >
        <DataTableProgressBar disabled={!isLoading} />
        <ExportListButton
          onExcelClick={onExcelClick}
          onCsvClick={onExcelClick}
          visible={!items.currentIdList.isEmpty()}
          reportName="Supplies"
        />
        {items.currentIdList.isEmpty() && (
          <BrowseEmptyList navigate={navigate} location={location} />
        )}
        {!items.currentIdList.isEmpty() && (
          <InventoryLogDataTable className={cssClasses('InventoryDataTable')}>
            <InventoryLogDataTableHead
              navigate={navigate}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={columns}
            />
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(inventoryItem => (
                  <InventoryLogTableRow
                    key={inventoryItem.get('id')}
                    inventoryItem={inventoryItem}
                  />
                ))}
            </TableBody>
          </InventoryLogDataTable>
        )}
        {!items.currentIdList.isEmpty() && (
          <BrowseTablePaginator
            navigate={navigate}
            location={location}
            intl={intl}
            paginatorStatus={messages.paginatorStatus}
            total={table.total}
            pageAt={pageAt}
            pageSize={pageSize}
          />
        )}
      </DataTableCard>{' '}
    </div>
  )
}

export const InventoryLog = ({ navigate, location }) => {
  // >>>>>> Defining hooks <<<<<<
  const dispatch = useDispatch()
  const intl = useIntl()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()

  // >>>>>> Defining selectors <<<<<<
  const inventory = useSelector(state => state.inventory)
  // const consumableReasons = useSelector(
  //   state => state.consumable.consumableReasons
  // )
  const [breakOutByLot, setBreakOutByLot] = useState(false)
  const dependencies = useMemo(
    () => ({
      breakOutByLot,
    }),
    [breakOutByLot]
  )

  // >>>>>> Structuring data <<<<<<
  const { table, items, inventoryAdjustment } = inventory
  const sortPage = makeSortPageSelector({
    sortCol: 'siteName',
  })
  const reducedFilters = reduceFiltersConfig(
    FILTERS_CONFIG,
    userPermissions,
    dependencies
  )
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({
    location,
    availableSortCol,
    dependencies,
  })
  const { value: searchParams } = searchSanitizer(location, dependencies)
  const { value: filtersParams } = filtersSanitizer(
    searchParams.get('filters') || '',
    dependencies
  )
  const filters = getFilters(filtersParams)
  // >>>>>> Defining callbacks <<<<<<
  const onExcelClick = useCallback(
    formatType => {
      const format = formatType.id
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportSupplies(
          filtersParams,
          breakOutByLot,
          sortCol,
          sortDir,
          pageAt,
          table.get('total') > 0 ? table.get('total') : 1,
          format,
          'supplies',
          dispatch
        )
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location, breakOutByLot, sortCol, sortDir, pageAt, table]
  )

  // >>>>>> Defining queries <<<<<<
  const params = {
    sortCol,
    sortDir,
    page: pageAt,
    size: pageSize,
    breakOutByLot,
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

  // >>>>>> Lifecycle hooks <<<<<<
  useEffect(() => {
    if (data) dispatch(receiveInventoryItems(data))
  }, [data, dispatch])

  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(
      location,
      dependencies
    )
    const { sanitized: filtersSanitized, value: filtersParams } =
      filtersSanitizer(searchParams.get('filters') || '', dependencies)
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
  }, [location, navigate, dependencies, dispatch])

  if (isError) throw new Error(error)

  const props = {
    intl,
    navigate,
    location,
    reducedFilters,
    dispatch,
    breakOutByLot,
    setBreakOutByLot,
    isLoading,
    onExcelClick,
    items,
    sortCol,
    sortDir,
    table,
    pageAt,
    pageSize,
    inventoryAdjustment,
  }

  return <InventoryLogWithProps {...props} />
}

export default InventoryLog
