import React, { useEffect, useState, useMemo } from 'react'
import { FormControlLabel, Switch, TableBody, LinearProgress, Stack, Typography } from '@mui/material'
import isNil from 'lodash/isNil'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useMutation, useQuery } from 'react-query'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { DetailHeader, InventoryItemsFilter } from '../../../cleanComponents'
import {
  HierarchicalSiteView,
  hierarchicalToggleSettingsLocalStorageKey,
  useHierarchicalSwitch,
} from '../../../cleanComponents/HierarchicalSiteView'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import PermissionChecker from '../../../components/PermissionChecker'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { INVENTORY_LIST } from '../../../components/QueryFetch/Inventory'
import useConsumableReasons from '../../../hooks/inventory/useConsumableReasons'
import useAuthState from '../../../hooks/useAuthState'
import { usePathFilter } from '../../../hooks/usePathFilter'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import { testConductedReasonI18nKey } from '../../../oldComponents/resource/ConsumableReasonSelectField'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { showAcknowledgement } from '../../../store/AppNotificationRedux'
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
import PakistanInventoryAdjustmentDialog from '../adjustment/InventoryAdjustmentDialog'
import { InventoryDataTable, InventoryDataTableHead, InventoryDataTableRow } from './InventoryDataTable'
import styles from './InventoryItemsList.module.css'
import getExportableFile from './InventoryItemsQueries'
import messages from './messages'
import { getColumns } from './tools'

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

export default function InventoryItemsList() {
  const [inventoryOnField, setInventoryOnField] = useState(false)
  const [filter, setFilter] = usePathFilter()
  const intl = useIntl()
  const user = useAuthState()
  const { isHierarchicalView, setIsHierarchicalView } = useHierarchicalSwitch({
    localStorageKey: hierarchicalToggleSettingsLocalStorageKey.INVENTORY_LIST,
  })
  const enableInventoryOnHandField = filter.breakOutByLot && inventoryOnField
  const columns = useMemo(
    () => getColumns(intl, { breakOutByLot: filter.breakOutByLot, enableInventoryOnHandField }),
    [enableInventoryOnHandField, filter.breakOutByLot, intl]
  )
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const inventory = useSelector(state => state.inventory)
  const { data: consumableReasons } = useConsumableReasons()
  const { table, items, inventoryAdjustment } = inventory
  const sortPage = makeSortPageSelector({ sortCol: 'siteName' })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({
    location,
    availableSortCol,
    dependencies: { breakOutByLot: filter.breakOutByLot },
  })
  const onAdjustInventorySucceeded = () => {
    showAcknowledgement({
      title: messages.inventoryAdjustedSuccessfully,
    })
  }

  const params = omitBy(
    {
      sortCol,
      sortDir,
      page: pageAt,
      size: pageSize,
      ...filter,
    },
    isNil
  )
  const {
    isError,
    isLoading: isLoadingData,
    data = false,
    error,
    refetch,
  } = useQuery([INVENTORY_LIST.KEY, params, filter], async () =>
    fetchWrapperForQueries({ endpoint: INVENTORY_LIST.ENDPOINT, params })
  )

  const onSuccess = () => {
    refetch()
    onAdjustInventorySucceeded()
  }

  const { mutateAsync: onExportClick, isLoading: isExporting } = useMutation(formatType =>
    getExportableFile(filter, formatType, sortCol, sortDir, data.total, 'supplies')
  )

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

  const { mutate: onAddInventorySubmit } = useMutation(
    values => addInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess,
    }
  )

  const { mutate: onTransferInventorySubmit } = useMutation(
    values => transferInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess,
    }
  )
  const { mutate: onReceiveInventorySubmit } = useMutation(
    values => receiveInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess,
    }
  )

  useEffect(() => {
    if (data) dispatch(receiveInventoryItems(data))
  }, [data, dispatch])

  if (isError) throw new Error(error)

  const handleSubmit = values => {
    switch (inventoryAdjustment.get('actionType')) {
      case types.SHOW_REMOVE_INVENTORY_DIALOG:
        onRemoveInventorySubmit(values)
        break
      case types.SHOW_TRANSFER_INVENTORY_DIALOG:
        onTransferInventorySubmit(values)
        break
      case types.SHOW_RECEIVE_INVENTORY_DIALOG:
        onReceiveInventorySubmit(values)
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
      <div className={styles.Container}>
        <Helmet title={intl.formatMessage(messages.inventoryItemsTitle)} />
        <InventoryItemsFilter />
        <Stack sx={{ flexDirection: 'row', gap: 1, width: '100%' }}>
          {isHierarchicalView && (
            <HierarchicalSiteView countryId={user.countryId} filters={filter} pathname="/browse/inventory/supplies" />
          )}
          <DataTableCard
            key={`DataTableCard__table-${location.key}`}
            className={styles.DataTableCard__table}
            sx={{ width: '100%' }}
          >
            <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" color="textSecondary">
                <Switch
                  checked={isHierarchicalView}
                  onChange={event => setIsHierarchicalView(event.currentTarget.checked)}
                />
                Hierarchical View
              </Typography>
              <Stack sx={{ flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={[true, 'true'].includes(filter.breakOutByLot)}
                      onChange={e => {
                        setFilter(prv => ({ ...prv, breakOutByLot: e.target.checked || null }))
                        setInventoryOnField(false)
                      }}
                    />
                  }
                  label={intl.formatMessage(messages.breakOutByLot)}
                  sx={{ m: 2 }}
                />
                {filter.breakOutByLot ? (
                  <PermissionChecker permissions={['inventory:edit']}>
                    <FormControlLabel
                      sx={{ p: 2 }}
                      control={
                        <Switch
                          checked={enableInventoryOnHandField}
                          onChange={event => setInventoryOnField(event.target.checked)}
                        />
                      }
                      label={intl.formatMessage(messages.adjustQuantity)}
                    />
                  </PermissionChecker>
                ) : null}
                <AspectExportListButton onExport={onExportClick} visible={!items.currentIdList.isEmpty()} />
              </Stack>
            </Stack>
            {isLoadingData || isExporting ? (
              <LinearProgress />
            ) : items.currentIdList.length === 0 ? (
              <BrowseEmptyList />
            ) : (
              <>
                <InventoryDataTable className={styles.InventoryDataTable}>
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
                          refetch={onSuccess}
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
        </Stack>

        {inventoryAdjustment.get('actionType') ? (
          <PakistanInventoryAdjustmentDialog
            actionType={inventoryAdjustment.get('actionType')}
            inventoryItem={items.getIn(['byId', inventoryAdjustment.get('inventoryItemId')], undefined)}
            onCancel={() => dispatch(hideAdjustInventoryDialog())}
            onSubmit={handleSubmit}
          />
        ) : null}
      </div>
    </>
  )
}
