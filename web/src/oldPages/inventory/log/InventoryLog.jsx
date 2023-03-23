import React, { useEffect, useState } from 'react'
import { TableBody } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import { Helmet } from 'react-helmet'
import { useQuery } from 'react-query'
import { useLocation, useNavigate } from 'react-router'
import DetailHeader from '../../../components/DetailHeader'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { INVENTORY_LOG } from '../../../components/QueryFetch/Inventory'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import BrowseFilters from '../../../oldComponents/filter/BrowseFilters'
import {
  getFilters,
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
  setFiltersForLast30Days,
} from '../../../oldComponents/filter/utils'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { useAuthState } from '../../../providers/AuthProvider'
import { makeSortPageSelector, makeSearchParamsSanitizer } from '../../../utils/selectors/searchParams'
import styles from './InventoryLog.css'
import { InventoryLogDataTable, InventoryLogDataTableHead, InventoryLogTableRow } from './InventoryLogDataTable'
import messages from './messages'

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
    onlyTransfers: true,
    requiredPermissions: [],
  },
  {
    lotNumber: true,
    requiredPermissions: [],
  },
  {
    expirationDate: true,
    requiredPermissions: [],
  },
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
    <>
      <DetailHeader name={intl.formatMessage(messages.inventoryLogTitle)} disableBack />
      <div className={cssClasses('Container')}>
        <Helmet title={intl.formatMessage(messages.inventoryLogTitle)} />
        <DataTableCard key={`DataTableCard--table-${location.key}`} className={cssClasses('DataTableCard--table')}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <BrowseFilters
              navigate={navigate}
              location={location}
              intl={intl}
              config={reducedFilters}
              dateFilterLabel={intl.formatMessage(messages.date)}
            />
          </div>

          <DataTableProgressBar disabled={!isLoading} />
          {!hasItems ? (
            <BrowseEmptyList navigate={navigate} location={location} />
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
  // >>>>>> Defining hooks <<<<<<
  const intl = useI18n()
  const { userPermissions } = useAuthState()
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions, {})
  const [firstLoad, setFirstLoad] = useState(true)
  const [requestParams, setRequestParams] = useState({})
  // >>>>>> Structuring data <<<<<<

  const {
    isError,
    isLoading,
    data = false,
    error,
  } = useQuery(
    [INVENTORY_LOG.KEY, requestParams],
    async () => fetchWrapperForQueries({ endpoint: INVENTORY_LOG.ENDPOINT, params: requestParams }),
    {
      enable: !isEmpty(requestParams),
    }
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

  useEffect(() => {
    // >>>>>> Defining queries <<<<<<
    const { value: searchParams } = searchSanitizer(location, {})
    const { value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '', {})
    searchParams.set('filters', filtersParams)
    if (firstLoad) {
      setFiltersForLast30Days(searchParams)
      setFirstLoad(false)
      navigate(
        {
          ...location,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      )
    }

    const filters = getFilters(filtersParams)
    setRequestParams({
      sortCol,
      sortDir,
      page: pageAt,
      size: pageSize,
      ...filters,
    })
  }, [location, navigate, firstLoad, sortCol, sortDir, pageAt, pageSize])

  if (isError) throw new Error(error)

  const props = {
    intl,
    navigate,
    location,
    reducedFilters,
    isLoading,
    data,
    ...{ sortCol, sortDir, pageAt, pageSize, ...requestParams },
  }
  return <InventoryLogWithProps {...props} />
}

export default InventoryLog
