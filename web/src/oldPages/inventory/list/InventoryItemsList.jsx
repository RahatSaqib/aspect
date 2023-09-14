import React, { useEffect, useState } from 'react'
import { FormControlLabel, Switch, TableBody, LinearProgress } from '@mui/material'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import omit from 'lodash/omit'
import { Helmet } from 'react-helmet'
import { useMutation, useQuery } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import ErrorBoundary from '../../../cleanComponents/ErrorBoundary/index'
import InventoryItemsFilter from '../../../cleanComponents/Filter/InventoryItemsFilter'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import PermissionChecker from '../../../components/PermissionChecker'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { INVENTORY_LIST } from '../../../components/QueryFetch/Inventory'
import useConsumableReasons from '../../../hooks/inventory/useConsumableReasons'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { useAuthState } from '../../../providers/AuthProvider'
import { useFilterValues } from '../../../providers/FilterProvider'
import { showAcknowledgement } from '../../../store/AppNotificationRedux'
import { fetchConsumables } from '../../../store/ConsumableRedux'
import {
  addInventory,
  hideAdjustInventoryDialog,
  receiveInventory,
  receiveInventoryItems,
  removeInventory,
  showNewInventoryDialog,
  transferInventory,
  types,
} from '../../../store/InventoryRedux'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import AddInventoryDialogForm from '../adjustment/AddInventoryDialogForm'
import { testConductedReasonI18nKey } from '../adjustment/InventoryAdjustmentDialogForm'
import NewInventoryDialogForm from '../adjustment/NewInventoryDialogForm'
import PakistanInventoryAdjustmentDialog from '../adjustment/PakistanInventoryAdjustmentDialog'
import ReceiveInventoryDialogForm from '../adjustment/ReceiveInventoryDialogForm'
import RemoveInventoryDialogForm from '../adjustment/RemoveInventoryDialogForm'
import TransferInventoryDialogForm from '../adjustment/TransferInventoryDialogForm'
import { InventoryDataTable, InventoryDataTableHead, InventoryDataTableRow } from './InventoryDataTable'
import styles from './InventoryItemsList.css'
import getExportableFile from './InventoryItemsQueries'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const EMPTY_MAP = Immutable.Map()

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

export const InventoryItemsListWithProps = ({
  intl,
  navigate,
  location,
  filter,
  dispatch,
  isLoading,
  onExportClick,
  items,
  sortCol,
  sortDir,
  table,
  pageAt,
  pageSize,
  inventoryAdjustment,
  onRemoveInventorySubmit,
  onReceiveInventorySubmit,
  onTransferInventorySubmit,
  onAddInventorySubmit,
  refetch,
}) => {
  const [enableInventoryOnHandField, setEnableInventoryOnHandField] = useState(false)

  const { isPakistan } = useAuthState()

  const columns = [
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
      key: 'quantityOnHand',
      label: intl.formatMessage(messages.quantityOnHand),
      sortable: true,
    },
    {
      key: 'dailyConsumptionRate',
      label: intl.formatMessage(messages.dailyConsumptionRate),
      sortable: true,
      isHidden: filter.breakOutByLot,
    },
    {
      key: 'lotNumber',
      label: intl.formatMessage(messages.lotNumber),
      sortable: true,
      isHidden: !filter.breakOutByLot,
    },
    {
      key: 'expiresOn',
      label: intl.formatMessage(messages.expiresOn),
      sortable: true,
      isHidden: !filter.breakOutByLot,
    },
    {
      key: 'newQuantity',
      label: intl.formatMessage(messages.newQuantityOnHand),
      isHidden: !enableInventoryOnHandField,
    },
    {
      key: 'inc-dec',
      label: intl.formatMessage(messages.resultQuantityOnHand),
      isHidden: !enableInventoryOnHandField,
    },
    {
      key: 'notes',
      label: intl.formatMessage(messages.inventoryOnNote),
      isHidden: !enableInventoryOnHandField,
    },
    {
      key: 'daysStockLeft',
      label: intl.formatMessage(messages.daysStockLeft),
      tooltip: intl.formatMessage(messages.daysStockLeftDescription),
      sortable: true,
      isHidden: filter.breakOutByLot,
    },
    {
      key: 'projectedWaste',
      label: intl.formatMessage(messages.projectedWaste),
      tooltip: intl.formatMessage(messages.projectedWasteDescription),
      sortable: true,
      isHidden: filter.breakOutByLot,
    },
    {
      key: 'action',
    },
  ]

  const handleSubmit = values => {
    switch (inventoryAdjustment.get('actionType')) {
      case types.SHOW_REMOVE_INVENTORY_DIALOG:
        onRemoveInventorySubmit(values)
        break
      case types.SHOW_TRANSFER_INVENTORY_DIALOG:
        onTransferInventorySubmit(values)
        break

      default: {
        onAddInventorySubmit(values)
      }
    }
  }

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.inventoryItemsTitle)} disableBack>
        <PermissionChecker permissions={['inventory:edit']}>
          <AspectButton variant="contained" onClick={() => dispatch(showNewInventoryDialog())} browseButton>
            {intl.formatMessage(messages.addInventory)}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <div className={cssClasses('Container')}>
        <Helmet title={intl.formatMessage(messages.inventoryItemsTitle)} />
        <InventoryItemsFilter />
        <DataTableCard key={`DataTableCard--table-${location.key}`} className={cssClasses('DataTableCard--table')}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            {filter.breakOutByLot ? (
              <PermissionChecker permissions={['inventory:edit']}>
                <FormControlLabel
                  sx={{ p: 2 }}
                  control={
                    <ErrorBoundary>
                      <Switch
                        onChange={event => setEnableInventoryOnHandField(filter.breakOutByLot && event.target.checked)}
                      />
                    </ErrorBoundary>
                  }
                  label={intl.formatMessage(messages.inventoryOnHand)}
                />
              </PermissionChecker>
            ) : null}
            <AspectExportListButton onExport={onExportClick} visible={!items.currentIdList.isEmpty()} />
          </div>
          {isLoading ? (
            <LinearProgress />
          ) : items.currentIdList.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
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
                      <InventoryDataTableRow
                        key={inventoryItem.get('id')}
                        inventoryItem={inventoryItem}
                        breakOutByLot={filter.breakOutByLot}
                        inventoryOnHand={enableInventoryOnHandField}
                        refetch={refetch}
                        navigate={navigate}
                        location={location}
                      />
                    ))}
                </TableBody>
              </InventoryDataTable>
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
                intl={intl}
                paginatorStatus={messages.paginatorStatus}
                total={table.total}
                pageAt={pageAt}
                pageSize={pageSize}
              />
            </>
          )}
        </DataTableCard>

        {isPakistan && inventoryAdjustment.get('actionType') ? (
          <PakistanInventoryAdjustmentDialog
            actionType={inventoryAdjustment.get('actionType')}
            inventoryItem={items.getIn(['byId', inventoryAdjustment.get('inventoryItemId')], undefined)}
            onCancel={() => dispatch(hideAdjustInventoryDialog())}
            onSubmit={handleSubmit}
          />
        ) : (
          <>
            <NewInventoryDialogForm
              intl={intl}
              isDialogActive={inventoryAdjustment.get('actionType') === types.SHOW_NEW_INVENTORY_DIALOG}
              onCancel={() => dispatch(hideAdjustInventoryDialog())}
              onSubmit={onAddInventorySubmit}
            />
            <AddInventoryDialogForm
              intl={intl}
              inventoryItem={items.getIn(['byId', inventoryAdjustment.get('inventoryItemId')], EMPTY_MAP)}
              isDialogActive={inventoryAdjustment.get('actionType') === types.SHOW_ADD_INVENTORY_DIALOG}
              onCancel={() => dispatch(hideAdjustInventoryDialog())}
              onSubmit={onAddInventorySubmit}
            />
            <RemoveInventoryDialogForm
              intl={intl}
              inventoryItem={items.getIn(['byId', inventoryAdjustment.get('inventoryItemId')], EMPTY_MAP)}
              isDialogActive={inventoryAdjustment.get('actionType') === types.SHOW_REMOVE_INVENTORY_DIALOG}
              onCancel={() => dispatch(hideAdjustInventoryDialog())}
              onSubmit={onRemoveInventorySubmit}
            />
            <TransferInventoryDialogForm
              intl={intl}
              inventoryItem={items.getIn(['byId', inventoryAdjustment.get('inventoryItemId')], EMPTY_MAP)}
              isDialogActive={inventoryAdjustment.get('actionType') === types.SHOW_TRANSFER_INVENTORY_DIALOG}
              onCancel={() => dispatch(hideAdjustInventoryDialog())}
              onSubmit={onTransferInventorySubmit}
            />
            <ReceiveInventoryDialogForm
              intl={intl}
              items={items}
              inventoryItem={items.getIn(['byId', inventoryAdjustment.get('inventoryItemId')], EMPTY_MAP)}
              isDialogActive={inventoryAdjustment.get('actionType') === types.SHOW_RECEIVE_INVENTORY_DIALOG}
              onCancel={() => dispatch(hideAdjustInventoryDialog())}
              onSubmit={onReceiveInventorySubmit}
            />
          </>
        )}
      </div>
    </>
  )
}

export const InventoryItemsList = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const filter = useFilterValues(location.pathname)
  // >>>>>> Defining hooks <<<<<<
  const dispatch = useDispatch()
  const intl = useI18n()

  const [isLoading, setIsLoading] = useState(true)

  // >>>>>> Defining selectors <<<<<<
  const inventory = useSelector(state => state.inventory)

  const { data: consumableReasons } = useConsumableReasons()
  // >>>>>> Structuring data <<<<<<
  const { table, items, inventoryAdjustment } = inventory
  const sortPage = makeSortPageSelector({ sortCol: 'siteName' })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({
    location,
    availableSortCol,
    dependencies: { breakOutByLot: filter.breakOutByLot },
  })
  // >>>>>> Defining callbacks <<<<<<
  const onAdjustInventorySucceeded = () => {
    showAcknowledgement({
      title: messages.inventoryAdjustedSuccessfully,
    })
  }

  // >>>>>> Defining queries <<<<<<
  const params = {
    sortCol,
    sortDir,
    page: pageAt,
    size: pageSize,
    ...filter,
  }
  const {
    isError,
    isLoading: tableLoading,
    data = false,
    error,
    refetch,
  } = useQuery([INVENTORY_LIST.KEY, params, filter], async () =>
    fetchWrapperForQueries({ endpoint: INVENTORY_LIST.ENDPOINT, params })
  )

  useEffect(() => {
    setIsLoading(tableLoading)
  }, [tableLoading])

  const onExportClick = formatType => {
    setIsLoading(true)
    return getExportableFile(filter, formatType, sortCol, sortDir, data.total, 'supplies')
      .then(response => {
        setIsLoading(false)
        return response
      })
      .catch(error => {
        setIsLoading(false)
        throw error
      })
  }

  // >>>>>> Defining mutations <<<<<<
  // onSuccess
  const onSuccess = () => {
    refetch()
    onAdjustInventorySucceeded()
  }

  // Remove
  const { mutate: onRemoveInventorySubmit } = useMutation(
    values => {
      const selectedAdjustmentReason = consumableReasons?.find(reason => reason?.id === values.reasonId)
      if (selectedAdjustmentReason?.i18nKey === testConductedReasonI18nKey) {
        return removeInventory(omit(values, ['canExpire', 'dateAdjusted']), dispatch, inventory).then(
          onAdjustInventorySucceeded
        )
      }
      return removeInventory(omit(values, ['canExpire', 'dateAdjustedFrom', 'dateAdjustedTo']), dispatch, inventory)
    },
    { onSuccess }
  )
  // Add
  const { mutate: onAddInventorySubmit } = useMutation(
    values => addInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess,
    }
  )
  // Transfer
  const { mutate: onTransferInventorySubmit } = useMutation(
    values => transferInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess,
    }
  )
  // Receive
  const { mutate: onReceiveInventorySubmit } = useMutation(
    values => receiveInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess,
    }
  )

  // >>>>>> Lifecycle hooks <<<<<<
  useEffect(() => {
    if (data) dispatch(receiveInventoryItems(data))
  }, [data, dispatch])

  useEffect(() => dispatch(fetchConsumables(false)), [dispatch])

  if (isError) throw new Error(error)

  const props = {
    intl,
    navigate,
    location,
    filter,
    dispatch,
    isLoading,
    onExportClick,
    items,
    sortCol,
    sortDir,
    table,
    pageAt,
    pageSize,
    inventoryAdjustment,
    onRemoveInventorySubmit,
    onReceiveInventorySubmit,
    onTransferInventorySubmit,
    onAddInventorySubmit,
    refetch: onSuccess,
  }

  return <InventoryItemsListWithProps {...props} />
}

export default InventoryItemsList
