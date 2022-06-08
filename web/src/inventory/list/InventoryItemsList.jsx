import flowRight from 'lodash/flowRight'
import omit from 'lodash/omit'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useIntl } from 'react-intl'
import { useQuery, useMutation, useQueryClient } from 'react-query'
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
import CheckboxField from '../../components/shared/CheckboxField'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import ExportListButton from '../../globals/components/ExportListButton'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import { testConductedReasonI18nKey } from '../adjustment/InventoryAdjustmentDialogForm'
import NewInventoryDialogForm from '../adjustment/NewInventoryDialogForm'
import AddInventoryDialogForm from '../adjustment/AddInventoryDialogForm'
import ReceiveInventoryDialogForm from '../adjustment/ReceiveInventoryDialogForm'
import RemoveInventoryDialogForm from '../adjustment/RemoveInventoryDialogForm'
import TransferInventoryDialogForm from '../adjustment/TransferInventoryDialogForm'
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
} from '../InventoryRedux'
import {
  InventoryDataTable,
  InventoryDataTableHead,
  InventoryDataTableRow,
} from './InventoryDataTable'
import requirePermissions, {
  isPermittedUser,
} from '../../components/shared/requirePermissions'
import AspectButton from '../../components/shared/AspectButton'
import { INVENTORY_LIST } from '../../MigratedComponents/QueryFetch/Inventory'
import messages from './messages'

import styles from './InventoryItemsList.css'
import AspectTooltip from '../../components/shared/AspectTooltip'

const cssClasses = classnames.bind(styles)

const EMPTY_MAP = Immutable.Map()

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
    isEnabled: dependencies => dependencies.breakOutByLot,
  },
  {
    lotNumber: true,
    requiredPermissions: [],
    isEnabled: dependencies => dependencies.breakOutByLot,
  },
  {
    daysStockLeft: true,
    requiredPermissions: [],
    isEnabled: dependencies => !dependencies.breakOutByLot,
  },
  {
    hasStock: true,
    requiredPermissions: [],
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
}) => {
  const { permissions: userPermissions } = useSelector(
    ({ user }) => user.toJS().jwt
  )
  const isEditAllow = isPermittedUser(userPermissions, {
    required: ['inventory:edit'],
  })

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
      key: 'daysStockLeft',
      label: (
        <div>
          <AspectTooltip
            title={intl.formatMessage(messages.daysStockLeftDescription)}
            showHelpIcon
          />
          {intl.formatMessage(messages.daysStockLeft)}
        </div>
      ),
      sortable: true,
      isHidden: breakOutByLot,
    },
    {
      key: 'projectedWaste',
      label: (
        <div>
          <AspectTooltip
            title={intl.formatMessage(messages.projectedWasteDescription)}
            showHelpIcon
          />
          {intl.formatMessage(messages.projectedWaste)}
        </div>
      ),
      sortable: true,
      isHidden: breakOutByLot,
    },
    isEditAllow && {
      key: 'action',
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
        <AddNewButton
          type="button"
          color="primary"
          variant="contained"
          onClick={() => dispatch(showNewInventoryDialog())}
          browseButton
        >
          {intl.formatMessage(messages.addInventory)}
        </AddNewButton>
      </BrowseFilters>

      <DataTableCard className={cssClasses('DataTableCard--action')}>
        <CheckboxField
          className={cssClasses('Checkbox')}
          name="breakOutByLot"
          checked={breakOutByLot}
          label={intl.formatMessage(messages.breakOutByLot)}
          onChange={event => setBreakOutByLot(event.target.checked)}
        />
      </DataTableCard>
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
                    isEditAllow={isEditAllow}
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
      <NewInventoryDialogForm
        intl={intl}
        isDialogActive={
          inventoryAdjustment.get('actionType') ===
          types.SHOW_NEW_INVENTORY_DIALOG
        }
        onCancel={() => dispatch(hideAdjustInventoryDialog())}
        onSubmit={onAddInventorySubmit}
      />
      <AddInventoryDialogForm
        intl={intl}
        inventoryItem={items.getIn(
          ['byId', inventoryAdjustment.get('inventoryItemId')],
          EMPTY_MAP
        )}
        isDialogActive={
          inventoryAdjustment.get('actionType') ===
          types.SHOW_ADD_INVENTORY_DIALOG
        }
        onCancel={() => dispatch(hideAdjustInventoryDialog())}
        onSubmit={onAddInventorySubmit}
      />
      <RemoveInventoryDialogForm
        intl={intl}
        inventoryItem={items.getIn(
          ['byId', inventoryAdjustment.get('inventoryItemId')],
          EMPTY_MAP
        )}
        isDialogActive={
          inventoryAdjustment.get('actionType') ===
          types.SHOW_REMOVE_INVENTORY_DIALOG
        }
        onCancel={() => dispatch(hideAdjustInventoryDialog())}
        onSubmit={onRemoveInventorySubmit}
      />
      <TransferInventoryDialogForm
        intl={intl}
        inventoryItem={items.getIn(
          ['byId', inventoryAdjustment.get('inventoryItemId')],
          EMPTY_MAP
        )}
        isDialogActive={
          inventoryAdjustment.get('actionType') ===
          types.SHOW_TRANSFER_INVENTORY_DIALOG
        }
        onCancel={() => dispatch(hideAdjustInventoryDialog())}
        onSubmit={onTransferInventorySubmit}
      />
      <ReceiveInventoryDialogForm
        intl={intl}
        items={items}
        inventoryItem={items.getIn(
          ['byId', inventoryAdjustment.get('inventoryItemId')],
          EMPTY_MAP
        )}
        isDialogActive={
          inventoryAdjustment.get('actionType') ===
          types.SHOW_RECEIVE_INVENTORY_DIALOG
        }
        onCancel={() => dispatch(hideAdjustInventoryDialog())}
        onSubmit={onReceiveInventorySubmit}
      />
    </div>
  )
}

export const InventoryItemsList = ({ navigate, location }) => {
  const queryClient = useQueryClient()
  // >>>>>> Defining hooks <<<<<<
  const dispatch = useDispatch()
  const intl = useIntl()
  const {
    jwt: { permissions: userPermissions },
  } = useAuthState()

  // >>>>>> Defining selectors <<<<<<
  const inventory = useSelector(state => state.inventory)
  const consumableReasons = useSelector(
    state => state.consumable.consumableReasons
  )
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
      const selectedAdjustmentReason = consumableReasons.items.find(
        reason => reason.get('id') === values.reasonId
      )
      if (
        selectedAdjustmentReason.get('i18nKey') === testConductedReasonI18nKey
      ) {
        return removeInventory(
          omit(values, ['canExpire', 'dateAdjusted']),
          dispatch,
          inventory
        ).then(onAdjustInventorySucceeded)
      }
      return removeInventory(
        omit(values, ['canExpire', 'dateAdjustedFrom', 'dateAdjustedTo']),
        dispatch,
        inventory
      )
    },
    { onSuccess }
  )
  // Add
  const { mutate: onAddInventorySubmit } = useMutation(
    values => addInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(INVENTORY_LIST.KEY)
        onAdjustInventorySucceeded()
      },
    }
  )
  // Transfer
  const { mutate: onTransferInventorySubmit } = useMutation(
    values =>
      transferInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess,
    }
  )
  // Receive
  const { mutate: onReceiveInventorySubmit } = useMutation(
    values =>
      receiveInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess,
    }
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
  }, [location, navigate, breakOutByLot, dependencies, dispatch])

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
  }

  return <InventoryItemsListWithProps {...props} />
}

export default InventoryItemsList
