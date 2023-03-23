import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { FormControlLabel, FormGroup, Switch, TableBody } from '@mui/material'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import flowRight from 'lodash/flowRight'
import omit from 'lodash/omit'
import { Helmet } from 'react-helmet'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import DetailHeader from '../../../components/DetailHeader'
import ErrorBoundary from '../../../components/ErrorBoundary/index'
import PermissionChecker from '../../../components/PermissionChecker'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { INVENTORY_LIST } from '../../../components/QueryFetch/Inventory'
import useI18n from '../../../hooks/useI18n'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import BrowseFilters from '../../../oldComponents/filter/BrowseFilters'
import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import CheckboxField from '../../../oldComponents/shared/CheckboxField'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import requirePermissions from '../../../oldComponents/shared/requirePermissions'
import { useAuthState } from '../../../providers/AuthProvider'
import { showAcknowledgement } from '../../../store/AppNotificationRedux'
import {
  types,
  hideAdjustInventoryDialog,
  addInventory,
  removeInventory,
  transferInventory,
  receiveInventory,
  exportSupplies,
  receiveInventoryItems,
  showNewInventoryDialog,
} from '../../../store/InventoryRedux'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../utils/selectors/searchParams'
import AddInventoryDialogForm from '../adjustment/AddInventoryDialogForm'
import { testConductedReasonI18nKey } from '../adjustment/InventoryAdjustmentDialogForm'
import NewInventoryDialogForm from '../adjustment/NewInventoryDialogForm'
import ReceiveInventoryDialogForm from '../adjustment/ReceiveInventoryDialogForm'
import RemoveInventoryDialogForm from '../adjustment/RemoveInventoryDialogForm'
import TransferInventoryDialogForm from '../adjustment/TransferInventoryDialogForm'
import { InventoryDataTable, InventoryDataTableHead, InventoryDataTableRow } from './InventoryDataTable'
import styles from './InventoryItemsList.css'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const EMPTY_MAP = Immutable.Map()

const FILTERS_CONFIG = [
  { consumable: true, requiredPermissions: [] },
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  { siteName: true, requiredPermissions: ['site:view'] },
  { date: true, requiredPermissions: [], isEnabled: dependencies => dependencies.breakOutByLot },
  { lotNumber: true, requiredPermissions: [], isEnabled: dependencies => dependencies.breakOutByLot },
  { daysStockLeft: true, requiredPermissions: [], isEnabled: dependencies => !dependencies.breakOutByLot },
  { hasStock: true, requiredPermissions: [] },
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
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

const AddNewButton = requirePermissions({
  permissions: ['inventory:edit'],
})(AspectButton)

export const InventoryItemsListWithProps = ({
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
  onRemoveInventorySubmit,
  onReceiveInventorySubmit,
  onTransferInventorySubmit,
  onAddInventorySubmit,
  refetch,
}) => {
  const [enableInventoryOnHandField, setEnableInventoryOnHandField] = useState(false)
  const breakOutByLotToggle = useCallback(() => {
    setBreakOutByLot(!breakOutByLot)
    setEnableInventoryOnHandField(false)
  }, [breakOutByLot, setEnableInventoryOnHandField, setBreakOutByLot])

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
      isHidden: breakOutByLot,
    },
    {
      key: 'lotNumber',
      label: intl.formatMessage(messages.lotNumber),
      sortable: true,
      isHidden: !breakOutByLot,
    },
    {
      key: 'expiresOn',
      label: intl.formatMessage(messages.expiresOn),
      sortable: true,
      isHidden: !breakOutByLot,
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
      isHidden: breakOutByLot,
    },
    {
      key: 'projectedWaste',
      label: intl.formatMessage(messages.projectedWaste),
      tooltip: intl.formatMessage(messages.projectedWasteDescription),
      sortable: true,
      isHidden: breakOutByLot,
    },
    {
      key: 'action',
    },
  ]

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.inventoryItemsTitle)} disableBack>
        <PermissionChecker permissions={['inventory:edit']}>
          <AddNewButton
            type="button"
            color="primary"
            variant="contained"
            onClick={() => dispatch(showNewInventoryDialog())}
            browseButton
          >
            {intl.formatMessage(messages.addInventory)}
          </AddNewButton>
        </PermissionChecker>
      </DetailHeader>
      <div className={cssClasses('Container')}>
        <Helmet title={intl.formatMessage(messages.inventoryItemsTitle)} />

        <DataTableCard className={cssClasses('DataTableCard--action')}>
          <FormGroup row>
            <FormControlLabel
              sx={{ m: 2 }}
              control={
                <CheckboxField
                  className={cssClasses('Checkbox')}
                  name="breakOutByLot"
                  checked={breakOutByLot}
                  label=""
                  onChange={breakOutByLotToggle}
                />
              }
              label={intl.formatMessage(messages.breakOutByLot)}
            />
            {breakOutByLot ? (
              <FormControlLabel
                sx={{ p: 2 }}
                control={
                  <ErrorBoundary>
                    <PermissionChecker permissions={['inventory:edit']}>
                      <Switch
                        onChange={event => setEnableInventoryOnHandField(breakOutByLot && event.target.checked)}
                      />
                    </PermissionChecker>
                  </ErrorBoundary>
                }
                label={intl.formatMessage(messages.inventoryOnHand)}
              />
            ) : null}
          </FormGroup>
        </DataTableCard>
        <DataTableCard key={`DataTableCard--table-${location.key}`} className={cssClasses('DataTableCard--table')}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <BrowseFilters
              navigate={navigate}
              location={location}
              intl={intl}
              config={reducedFilters}
              dateFilterLabel={intl.formatMessage(messages.expiresOn)}
            >
              <AspectExportListButton onExport={onExcelClick} visible={!items.currentIdList.isEmpty()} />
            </BrowseFilters>
          </div>
          <DataTableProgressBar disabled={!isLoading} />
          {items.currentIdList.length === 0 ? (
            <BrowseEmptyList navigate={navigate} location={location} />
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
                        breakOutByLot={breakOutByLot}
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
      </div>
    </>
  )
}

export const InventoryItemsList = () => {
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  // >>>>>> Defining hooks <<<<<<
  const dispatch = useDispatch()
  const intl = useI18n()
  const { userPermissions } = useAuthState()

  // >>>>>> Defining selectors <<<<<<
  const inventory = useSelector(state => state.inventory)
  const consumableReasons = useSelector(state => state.consumable.consumableReasons)
  const [breakOutByLot, setBreakOutByLot] = useState(false)
  const dependencies = useMemo(() => ({ breakOutByLot }), [breakOutByLot])

  // >>>>>> Structuring data <<<<<<
  const { table, items, inventoryAdjustment } = inventory
  const sortPage = makeSortPageSelector({ sortCol: 'siteName' })
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions, dependencies)
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location, availableSortCol, dependencies })
  const { value: searchParams } = searchSanitizer(location, dependencies)
  const { value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '', dependencies)
  const filters = getFilters(filtersParams)
  // >>>>>> Defining callbacks <<<<<<
  const onExcelClick = useCallback(
    formatType => {
      const format = formatType
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
    breakOutByLot,
    ...filters,
  }
  const {
    isError,
    isLoading,
    data = false,
    error,
  } = useQuery([INVENTORY_LIST.KEY, params, filters], async () =>
    fetchWrapperForQueries({ endpoint: INVENTORY_LIST.ENDPOINT, params })
  )
  // >>>>>> Defining mutations <<<<<<
  // onSuccess
  const onSuccess = () => {
    queryClient.invalidateQueries(INVENTORY_LIST.KEY)
    onAdjustInventorySucceeded()
  }
  // Remove
  const { mutate: onRemoveInventorySubmit } = useMutation(
    values => {
      const selectedAdjustmentReason = consumableReasons.items.find(reason => reason.get('id') === values.reasonId)
      if (selectedAdjustmentReason.get('i18nKey') === testConductedReasonI18nKey) {
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

  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location, dependencies)
    const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(
      searchParams.get('filters') || '',
      dependencies
    )
    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)
      navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    }
  }, [location, navigate, breakOutByLot, dependencies, dispatch])

  useEffect(() => {
    const searchParams = new URLSearchParams()
    searchParams.set('filters', new URLSearchParams(location.search).get('filters') || '')
    const filtersParams = new URLSearchParams(searchParams.get('filters'))
    if (!filtersParams.has('hasStock')) {
      filtersParams.set('hasStock', true)
      searchParams.set('filters', filtersParams)
      navigate({ ...location, search: `?${searchParams.toString()}` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    onRemoveInventorySubmit,
    onReceiveInventorySubmit,
    onTransferInventorySubmit,
    onAddInventorySubmit,
    refetch: onSuccess,
  }

  return <InventoryItemsListWithProps {...props} />
}

export default InventoryItemsList
