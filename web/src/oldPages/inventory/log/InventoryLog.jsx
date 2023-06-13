import React from 'react'
import { TableBody } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import { Helmet } from 'react-helmet'
import { useQuery } from 'react-query'
import { useLocation, useNavigate } from 'react-router'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import InventoryLogFilter from '../../../cleanComponents/Filter/InventoryLogFilter'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { INVENTORY_LOG } from '../../../components/QueryFetch/Inventory'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { useFilterValues } from '../../../providers/FilterProvider'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { InventoryLogDataTable, InventoryLogDataTableHead, InventoryLogTableRow } from './InventoryLogDataTable'
import messages from './messages'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

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
    <>
      <DetailHeader name={intl.formatMessage(messages.inventoryLogTitle)} disableBack />
      <div className={cssClasses('Container')}>
        <Helmet title={intl.formatMessage(messages.inventoryLogTitle)} />
        <InventoryLogFilter />
        <DataTableCard key={`DataTableCard--table-${location.key}`} className={cssClasses('DataTableCard--table')}>
          <DataTableProgressBar disabled={!isLoading} />
          {!hasItems ? (
            <BrowseEmptyList />
          ) : (
            <>
              <InventoryLogDataTable className={cssClasses('InventoryDataTable')}>
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
                      // eslint-disable-next-line react/no-array-index-key
                      key={`InventoryLog---${location.key}--${index}`}
                      inventoryLogItem={inventoryLogItem}
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
      </div>
    </>
  )
}

const InventoryLog = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const filters = useFilterValues(location.pathname)
  // >>>>>> Defining hooks <<<<<<
  const intl = useI18n()
  // >>>>>> Structuring data <<<<<<

  const apiFilters = { ...filters }

  if (Object.keys(apiFilters).includes('maxExpirationDate')) {
    apiFilters.maxExpirationDate = apiFilters.maxExpirationDate.toISOString()
    apiFilters.minExpirationDate = apiFilters.minExpirationDate.toISOString()
  }

  const {
    isError,
    isLoading,
    data = false,
    error,
  } = useQuery(
    [INVENTORY_LOG.KEY, { sortCol, sortDir, page: pageAt, size: pageSize, ...apiFilters }],
    async () =>
      fetchWrapperForQueries({
        endpoint: INVENTORY_LOG.ENDPOINT,
        params: { sortCol, sortDir, page: pageAt, size: pageSize, ...apiFilters },
      }),
    { enable: !isEmpty(apiFilters) }
  )
  const sortPage = makeSortPageSelector({
    sortCol: 'createdOn',
    sortDir: 'desc',
    pageSize: 50,
  })

  const { sortCol, sortDir, pageAt, pageSize } = sortPage({
    location,
    availableSortCol,
    dependencies: {},
  })

  if (isError) throw new Error(error)

  const props = {
    intl,
    navigate,
    location,
    isLoading,
    data,
    ...{ sortCol, sortDir, pageAt, pageSize, page: pageAt, size: pageSize, ...filters },
  }
  return <InventoryLogWithProps {...props} />
}

export default InventoryLog
