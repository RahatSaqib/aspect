import classnames from 'classnames/bind'
import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'

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
} from '../../shared/selectors/searchParams'

import NavTitle from '../../globals/components/NavTitle'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { receiveInventoryItems } from '../InventoryRedux'

import {
  InventoryDataTable,
  InventoryDataTableHead,
} from '../list/InventoryDataTable'
import InventoryOnHandTableRow from './InventoryOnHandTableRow'
import { INVENTORY_LIST } from '../../MigratedComponents/QueryFetch/Inventory'
import messages from '../list/messages'

import styles from './InventoryItemsList.css'

const cssClasses = classnames.bind(styles)

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

export const InventoryItemsListWithProps = ({
  intl,
  navigate,
  location,
  breakOutByLot,
  isLoading,
  items,
  sortCol,
  sortDir,
  table,
  pageAt,
  pageSize,
}) => {
  const columns = [
    {
      key: 'expiresOn',
      label: intl.formatMessage(messages.expiresOn),
    },
    {
      key: 'lotNumber',
      label: intl.formatMessage(messages.lotNumber),
    },
    {
      key: 'quantityOnHand',
      label: intl.formatMessage(messages.quantityOnHand),
    },
    {
      key: 'newQuantityOnHand',
      label: 'New Quantity On Hand',
    },
    {
      key: 'resultQuantityOnHand',
      label: 'Result Quantity On Hand',
    },
  ]

  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.inventoryItemsTitle)} />
      <NavTitle title={intl.formatMessage(messages.inventoryItemsTitle)} />
      <DataTableCard className={cssClasses('DataTableCard--title')}>
        Site and Consumable here
      </DataTableCard>
      <DataTableCard
        key={`DataTableCard--table-${location.key}`}
        className={cssClasses('DataTableCard--table')}
      >
        <DataTableProgressBar disabled={!isLoading} />
        {items.currentIdList.isEmpty() && (
          <BrowseEmptyList navigate={navigate} location={location} />
        )}
        {!items.currentIdList.isEmpty() && (
          <InventoryDataTable className={cssClasses('InventoryDataTable')}>
            <InventoryDataTableHead
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
                  <InventoryOnHandTableRow
                    key={inventoryItem.get('id')}
                    inventoryItem={inventoryItem}
                    breakOutByLot={breakOutByLot}
                    navigate={navigate}
                    location={location}
                  />
                ))}
            </TableBody>
          </InventoryDataTable>
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
      </DataTableCard>
    </div>
  )
}

export const InventoryItemsList = ({ navigate, location }) => {
  // >>>>>> Defining hooks <<<<<<
  const dispatch = useDispatch()
  const intl = useIntl()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()

  // >>>>>> Defining selectors <<<<<<
  const inventory = useSelector(state => state.inventory)
  // >>>>>> Structuring data <<<<<<
  const { table, items, inventoryAdjustment } = inventory
  const sortPage = makeSortPageSelector({
    sortCol: 'siteName',
  })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({
    location,
    availableSortCol,
  })

  // >>>>>> Defining callbacks <<<<<<

  const { siteId, consumableId } = useParams()
  // >>>>>> Defining queries <<<<<<
  const params = {
    sortCol,
    sortDir,
    page: pageAt,
    size: pageSize,
    breakOutByLot: true,
    siteId,
    consumableId,
  }
  const {
    isError,
    isLoading,
    data = false,
    error,
  } = useQuery([INVENTORY_LIST.KEY, params], async () => {
    return fetchWrapperForQueries({ endpoint: INVENTORY_LIST.ENDPOINT, params })
  })

  // >>>>>> Lifecycle hooks <<<<<<
  useEffect(() => {
    if (data) {
      const qtyOnHandData = data.data.map(x => {
        return {
          id: x.id,
          consumableId: x.consumableId,
          siteId: x.siteId,
          lotNumber: x.lotNumber,
          quantityOnHand: x.quantityOnHand,
          expiresOn: x.expiresOn,
          newQuantityOnHand: 0,
          resultQuantityOnHand: 0,
        }
      })
      const newData = { ...data }
      newData.data = qtyOnHandData
      dispatch(receiveInventoryItems(newData))
    }
  }, [data, dispatch])

  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    if (sanitized) {
      navigate(
        {
          ...location,
          search: `?${searchParams.toString()}`,
        },
        { replace: true }
      )
    }
  }, [location, navigate, dispatch])

  if (isError) throw new Error(error)

  const props = {
    intl,
    navigate,
    location,
    dispatch,
    isLoading,
    items,
    sortCol,
    sortDir,
    table,
    pageAt,
    pageSize,
    inventoryAdjustment,
  }

  return <InventoryItemsListWithProps {...props} />
}

export default InventoryItemsList
