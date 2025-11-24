import React from 'react'
import { LinearProgress, Stack, Switch, TableBody, Typography } from '@mui/material'
import isEmpty from 'lodash/isEmpty'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { DetailHeader, InventoryLogFilter } from '../../../cleanComponents'
import {
  HierarchicalView,
  hierarchicalToggleSettingsLocalStorageKey,
  useHierarchicalSwitch,
} from '../../../cleanComponents/HierarchicalSiteView'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { INVENTORY_KEY, INVENTORY_KEY_TYPE_LOG_ENDPOINT } from '../../../hooks/inventory/inventoryKeys'
import usePartner from '../../../hooks/partner/usePartner'
import useAuthState from '../../../hooks/useAuthState'
import useFilterValues from '../../../hooks/useFilterValues'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { getTimezoneById } from '../../../utils/utils/timezone'
import { strategyRequireExpirationDate, strategyRequireLot } from '../strategyHelper'
import { InventoryLogDataTable, InventoryLogDataTableHead, InventoryLogTableRow } from './InventoryLogDataTable'
import messages from './messages'
import styles from './styles.module.css'

const availableSortCol = [
  'createdOn',
  'siteName',
  'lotNumber',
  'consumableName',
  'movementReason',
  'expiresOn',
  'quantity',
  'transactionDate',
  'notes',
]

export const InventoryLogWithProps = ({
  intl,
  navigate,
  location,
  isLoading,
  data,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  filters,
  isHierarchicalView,
  setIsHierarchicalView,
  isWarehouseView,
  setIsWarehouseView,
  setSelectedSiteIds,
  disableFilters,
}) => {
  const user = useAuthState()
  const { isLoadingPartner, data: partner } = usePartner()
  const requireExpirationDate = strategyRequireExpirationDate(partner?.inventoryStrategy)
  const requireLotNumber = strategyRequireLot(partner?.inventoryStrategy)

  const columns = [
    {
      key: 'createdOn',
      label: intl.formatMessage(messages.registrationDate),
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
      isHidden: !requireLotNumber,
    },
    {
      key: 'expiresOn',
      label: intl.formatMessage(messages.expiresOn),
      sortable: true,
      isHidden: !requireExpirationDate,
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
    {
      key: 'transactionDate',
      label: intl.formatMessage(messages.transactionDate),
      sortable: true,
    },
  ]
  const { data: items, total } = data || { data: null }
  const hasItems = items && items.length > 0
  const { timezoneId } = useSelector(({ user }) => user)
  const validTimeZone = getTimezoneById(timezoneId)
  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.inventoryLogTitle)} disableBack />
      <div className={styles.Container}>
        <Helmet title={intl.formatMessage(messages.inventoryLogTitle)} />
        <InventoryLogFilter
          disabled={disableFilters}
          requireLotNumber={requireLotNumber}
          requireExpirationDate={requireExpirationDate}
        />
        <Stack sx={{ flexDirection: 'row', width: '100%', gap: 1 }}>
          {isHierarchicalView && (
            <HierarchicalView
              countryId={user.countryId}
              filters={filters}
              pathname="/browse/inventory/log"
              isWarehouseView={isWarehouseView}
              setIsWarehouseView={setIsWarehouseView}
              setSelectedSiteIds={setSelectedSiteIds}
            />
          )}
          <DataTableCard
            key={`DataTableCard__table-${location.key}`}
            className={styles.DataTableCard__table}
            sx={{ width: '100%' }}
          >
            <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <Typography variant="subtitle2" color="textSecondary">
                <Switch
                  checked={isHierarchicalView}
                  onChange={event => setIsHierarchicalView(event.currentTarget.checked)}
                />
                {intl.formatMessage(messages.hierarchicalView)}
              </Typography>
            </Stack>
            {isLoading || isLoadingPartner ? (
              <LinearProgress />
            ) : !hasItems ? (
              <BrowseEmptyList />
            ) : (
              <>
                <InventoryLogDataTable className={styles.InventoryDataTable}>
                  <InventoryLogDataTableHead
                    navigate={navigate}
                    location={location}
                    sortColumnKey={sortCol}
                    sortColumnDir={sortDir}
                    columns={columns}
                  />
                  <TableBody>
                    {items.map((inventoryLogItem, index) => (
                      <InventoryLogTableRow
                        key={`InventoryLog---${location.key}--${index}`}
                        inventoryLogItem={inventoryLogItem}
                        timeZone={validTimeZone}
                        requireExpirationDate={requireExpirationDate}
                        requireLotNumber={requireLotNumber}
                      />
                    ))}
                  </TableBody>
                </InventoryLogDataTable>
                <BrowseTablePaginator
                  navigate={navigate}
                  location={location}
                  intl={intl}
                  pageSizeButtonKeys={[10, 25, 50, 100]}
                  paginatorStatus={messages.paginatorStatus}
                  total={total}
                  pageAt={pageAt}
                  pageSize={pageSize}
                />
              </>
            )}
          </DataTableCard>
        </Stack>
      </div>
    </>
  )
}

const InventoryLog = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const filters = useFilterValues(location.pathname)
  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({
    sortCol: 'createdOn',
    sortDir: 'desc',
    pageSize: 50,
  })({
    location,
    availableSortCol,
    dependencies: {},
  })

  // >>>>>> Defining hooks <<<<<<
  const intl = useIntl()
  // >>>>>> Structuring data <<<<<<

  const apiFilters = { ...filters }

  if (Object.keys(apiFilters).includes('maxExpirationDate')) {
    apiFilters.maxExpirationDate = new Date(apiFilters.maxExpirationDate).toISOString()
    apiFilters.minExpirationDate = new Date(apiFilters.minExpirationDate).toISOString()
  }

  const {
    isHierarchicalView,
    setIsHierarchicalView,
    isWarehouseView,
    setIsWarehouseView,
    selectedSiteIds,
    setSelectedSiteIds,
  } = useHierarchicalSwitch({
    localStorageKey: hierarchicalToggleSettingsLocalStorageKey.INVENTORY_LOG,
  })

  // Disabling the filters since we don't have the filters on warehouse level
  const disableFilters = isHierarchicalView && isWarehouseView

  const inventoryLogFilters = disableFilters ? { siteIds: selectedSiteIds.join(',') } : apiFilters

  const {
    isError,
    isLoading,
    data = false,
    error,
  } = useQuery(
    [
      INVENTORY_KEY,
      'inventory_logs',
      {
        sortCol,
        sortDir,
        page: pageAt,
        size: pageSize,
        ...inventoryLogFilters,
      },
    ],
    async () =>
      fetchWrapperForQueries({
        endpoint: INVENTORY_KEY_TYPE_LOG_ENDPOINT,
        params: {
          sortCol,
          sortDir,
          page: pageAt,
          size: pageSize,
          ...inventoryLogFilters,
        },
      }),
    { enable: !isEmpty(apiFilters) }
  )

  if (isError) throw new Error(error)

  const props = {
    intl,
    navigate,
    location,
    isLoading,
    data,
    filters,
    isHierarchicalView,
    setIsHierarchicalView,
    isWarehouseView,
    setIsWarehouseView,
    setSelectedSiteIds,
    disableFilters,
    ...{ sortCol, sortDir, pageAt, pageSize, page: pageAt, size: pageSize },
  }
  return <InventoryLogWithProps {...props} />
}
export default InventoryLog
