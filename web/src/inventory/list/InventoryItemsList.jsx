import flowRight from 'lodash/flowRight'
import fromPairs from 'lodash/fromPairs'
import omit from 'lodash/omit'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React, { useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { useQuery, useMutation, queryCache } from 'react-query'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'

import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import {
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
  toggleGroupBySite,
  showNewInventoryDialog,
  hideAdjustInventoryDialog,
  addInventory,
  removeInventory,
  transferInventory,
  receiveInventory,
  exportSupplies,
  receiveInventoryItems,
} from '../InventoryRedux'
import {
  InventoryDataTable,
  InventoryDataTableHead,
  InventoryDataTableRow,
} from './InventoryDataTable'
import requirePermissions from '../../components/shared/requirePermissions'
import AspectButton from '../../components/shared/AspectButton'
import {
  INVENTORY_LIST,
  INVENTORY_LIST_GROUP_BY_SITE,
} from '../../MigratedComponents/QueryFetch/Inventory'
import messages from './messages'

const cssClasses = classnames.bind(require('./InventoryItemsList.css'))

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
  { date: true, requiredPermissions: [] },
  { stockLeft: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'siteName',
    'consumableName',
    'quantityOnHand',
    'expiresOn',
    'stockLeft',
  ],
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
  history,
  location,
  reducedFilters,
  dispatch,
  groupBySite,
  onGroupBySiteChange,
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
  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.inventoryItemsTitle)} />
      <NavTitle title={intl.formatMessage(messages.inventoryItemsTitle)} />
      <BrowseFilters
        history={history}
        location={location}
        intl={intl}
        config={reducedFilters}
        dateFilterLabel={intl.formatMessage(messages.expiresOn)}
      >
        <AddNewButton
          type="button"
          color="primary"
          variant="contained"
          onClick={() => dispatch(showNewInventoryDialog)}
          browseButton
        >
          {intl.formatMessage(messages.addInventory)}
        </AddNewButton>
      </BrowseFilters>

      <DataTableCard className={cssClasses('DataTableCard--action')}>
        <CheckboxField
          className={cssClasses('Checkbox')}
          name="groupBySite"
          checked={groupBySite}
          label={intl.formatMessage(messages.groupBySite)}
          onChange={onGroupBySiteChange}
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
          <BrowseEmptyList history={history} location={location} intl={intl} />
        )}
        {!items.currentIdList.isEmpty() && (
          <InventoryDataTable className={cssClasses('InventoryDataTable')}>
            <InventoryDataTableHead
              history={history}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={[
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
                  key: 'expiresOn',
                  label: intl.formatMessage(messages.expiresOn),
                  sortable: true,
                },
                {
                  key: 'stockLeft',
                  label: intl.formatMessage(messages.stockLeft),
                  sortable: true,
                },
                {
                  key: 'action',
                },
              ]}
            />
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(inventoryItem => (
                  <InventoryDataTableRow
                    key={inventoryItem.get('id')}
                    inventoryItem={inventoryItem}
                  />
                ))}
            </TableBody>
          </InventoryDataTable>
        )}
        {!items.currentIdList.isEmpty() && (
          <BrowseTablePaginator
            history={history}
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

export const InventoryItemsList = () => {
  // >>>>>> Defining hooks <<<<<<
  const dispatch = useDispatch()
  const history = useHistory()
  const location = useLocation()
  const intl = useIntl()

  // >>>>>> Defining selectors <<<<<<
  const inventory = useSelector(state => state.inventory)
  const userPermissions = useSelector(state => state.user.jwt.permissions)
  const consumableReasons = useSelector(
    state => state.consumable.consumableReasons
  )

  // >>>>>> Structuring data <<<<<<
  const groupBySite = inventory.getIn(['table', 'groupBy']).includes('siteId')
  const { table, items, inventoryAdjustment } = inventory
  const sortPage = makeSortPageSelector({
    sortCol: 'siteName',
  })
  const { sortCol, sortDir, pageAt, pageSize } = sortPage({ location })
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, userPermissions)
  const searchParams = new URLSearchParams(location.search)
  const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
  const filters = fromPairs([...filtersParams.entries()])

  // >>>>>> Defining callbacks <<<<<<
  const onExcelClick = useCallback(
    formatType => {
      const format = formatType.id
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportSupplies(
          filtersParams,
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
    [location, sortCol, sortDir, pageAt, table]
  )
  const onAdjustInventorySucceeded = () => {
    showAcknowledgement({
      title: messages.inventoryAdjustedSuccessfully,
    })
  }
  const onGroupBySiteChange = (_, isInputChecked) => {
    dispatch(toggleGroupBySite(isInputChecked))
  }

  // >>>>>> Defining queries <<<<<<
  const endpointConfig = groupBySite
    ? INVENTORY_LIST_GROUP_BY_SITE
    : INVENTORY_LIST
  const params = { sortCol, sortDir, page: pageAt, size: pageSize, ...filters }
  const { isError, isLoading, data = false, error } = useQuery(
    [endpointConfig.KEY, params, filters],
    async () =>
      fetchWrapperForQueries({ endpoint: endpointConfig.ENDPOINT, params })
  )

  // >>>>>> Defining mutations <<<<<<
  // onSuccess
  const onSuccess = () => {
    queryCache.invalidateQueries(endpointConfig.KEY)
    onAdjustInventorySucceeded()
  }
  // Remove
  const [onRemoveInventorySubmit] = useMutation(
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
  const [onAddInventorySubmit] = useMutation(
    values => addInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess: () => {
        queryCache.invalidateQueries(endpointConfig.KEY)
        onAdjustInventorySucceeded()
      },
    }
  )
  // Transfer
  const [onTransferInventorySubmit] = useMutation(
    values =>
      transferInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess,
    }
  )
  // Receive
  const [onReceiveInventorySubmit] = useMutation(
    values =>
      receiveInventory(omit(values, ['canExpire']), dispatch, inventory),
    {
      onSuccess,
    }
  )

  // >>>>>> Lifecycle hooks <<<<<<
  useEffect(() => {
    if (data)
      dispatch(
        receiveInventoryItems(data, groupBySite ? ['inventoryItems'] : [])
      )
  }, [data, groupBySite, dispatch])
  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    const {
      sanitized: filtersSanitized,
      value: filtersParams,
    } = filtersSanitizer(searchParams.get('filters') || '')
    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    }
  }, [location, history, dispatch])

  if (isError) throw new Error(error)

  const props = {
    intl,
    history,
    location,
    reducedFilters,
    dispatch,
    groupBySite,
    onGroupBySiteChange,
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
