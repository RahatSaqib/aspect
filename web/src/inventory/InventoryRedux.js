import { defineMessages } from 'react-intl'
import { stringify } from 'querystring'
import Immutable from 'immutable'
import startOfToday from 'date-fns/start_of_today'

import { aspectFetch } from '../shared/utils/fetch'
import { nonEmptyFilterValue } from '../filter/utils'
import { receiveList, Items } from '../shared/metaReducers/groupedItems'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/groupedTable'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
} from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_INVENTORY_ITEMS: 'REQUEST_INVENTORY_ITEMS',
  RECEIVE_INVENTORY_ITEMS: 'RECEIVE_INVENTORY_ITEMS',
  TOGGLE_GROUP_BY_SITE: 'TOGGLE_GROUP_BY_SITE',
  ADJUST_INVENTORY_LEVELS: 'ADJUST_INVENTORY_LEVELS',
  ADD_INVENTORY_ITEM: 'ADD_INVENTORY_ITEM',
  FINISH_ADJUSTING_INVENTORY_LEVELS: 'FINISH_ADJUSTING_INVENTORY_LEVELS',
  ADD_INVENTORY: 'ADD_INVENTORY',
  REMOVE_INVENTORY: 'REMOVE_INVENTORY',
  TRANSFER_INVENTORY: 'TRANSFER_INVENTORY',
  RECEIVE_INVENTORY: 'RECEIVE_INVENTORY',
  CHANGE_ADJUSTMENT_CONSUMABLE: 'CHANGE_ADJUSTMENT_CONSUMABLE',
}

export const addOperation = 'add'
export const removeOperation = 'remove'
export const transferOperation = 'transfer'
export const receiveOperation = 'receive'

/*
 * ---------------- Action Creators -----------------
 */
function requestInventoryItems(sortCol, sortDir, page, size, filters, groupBy) {
  return {
    type: types.REQUEST_INVENTORY_ITEMS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
    groupBy,
  }
}

function receiveInventoryItems(json, childrenPropertyPath) {
  return {
    type: types.RECEIVE_INVENTORY_ITEMS,
    items: json.data,
    total: json.total,
    childrenPropertyPath,
  }
}

function getFilters(state, extraFilters) {
  return state.filter.listFilter
    .toMap()
    .merge(extraFilters)
    .filter(nonEmptyFilterValue)
    .toJS()
}

function getGroupBy(state) {
  return state.inventory.getIn(['table', 'groupBy'])
}

export function toggleGroupBySite(toggleOn) {
  return dispatch => {
    dispatch({ type: types.TOGGLE_GROUP_BY_SITE, toggleOn })
    return dispatch(fetchListFilteredInventoryItems())
  }
}

export function fetchListFilteredInventoryItems(extraFilters = {}, ...args) {
  return (dispatch, getState) => {
    const groupBy = getGroupBy(getState())
    const filters = getFilters(getState(), extraFilters)
    return dispatch(fetchInventoryItems(groupBy, filters, ...args))
  }
}

export function fetchInventoryItems(
  groupBy,
  filters /* required */,
  sortCol = 'siteName',
  sortDir = 'asc',
  page = 0,
  pageSize = 10
) {
  const groupBySite = groupBy.includes('siteId')
  const path = groupBySite ? '/inventory/group-by-site' : '/inventory'
  return dispatch => {
    dispatch(
      requestInventoryItems(sortCol, sortDir, page, pageSize, filters, groupBy)
    )
    return aspectFetch(
      `${path}?${stringify({
        sortCol,
        sortDir,
        page,
        size: pageSize,
        ...filters,
      })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchInventoryItems.GET.400.title',
                defaultMessage: 'Searching Inventory Items Failed',
              },
            })
          ),
          default: errorPleaseTryAgainInAFewMinutes(
            defineMessages({
              title: {
                id: 'errorResponseMessages.fetchInventoryItems.GET.default.title',
                defaultMessage: 'Loading Inventory Items Failed',
              },
            })
          ),
        },
      }
    ).then(json =>
      dispatch(
        receiveInventoryItems(json, groupBySite ? ['inventoryItems'] : [])
      )
    )
  }
}

function startAddingInventory(details) {
  return {
    type: types.ADD_INVENTORY,
    details,
  }
}

function startRemovingInventory(details) {
  return {
    type: types.REMOVE_INVENTORY,
    details,
  }
}

function startTransferringInventory(details) {
  return {
    type: types.TRANSFER_INVENTORY,
    details,
  }
}

function startReceivingInventory(details) {
  return {
    type: types.RECEIVE_INVENTORY,
    details,
  }
}

export function adjustInventoryLevels(operation, inventoryItem) {
  const expiresOn = inventoryItem.get('expiresOn')
  const adjustmentDetails = {
    inventoryItemId: inventoryItem.get('id'),
    consumableId: inventoryItem.get('consumableId'),
    expiresOn: expiresOn ? new Date(expiresOn) : undefined,
    canExpire: inventoryItem.get('canExpire') === 1,
    lotNumber: inventoryItem.get('lotNumber'),
    consumableName: inventoryItem.get('consumableName'),
    quantity: 0,
    quantityOnHand: inventoryItem.get('quantityOnHand'),
    unitShortName: inventoryItem.get('unitShortName'),
    notes: '',
    dateAdjusted: startOfToday(),
    dateAdjustedFrom: startOfToday(),
    dateAdjustedTo: startOfToday(),
    toSiteId: -1,
    fromSiteId: -1,
    reasonId: -1,
  }
  let operationAdjustmentDetails = {}
  if (operation === addOperation) {
    operationAdjustmentDetails = {
      toSiteId: inventoryItem.get('siteId'),
    }
  }
  if (operation === removeOperation) {
    operationAdjustmentDetails = {
      fromSiteId: inventoryItem.get('siteId'),
    }
  }
  if (operation === transferOperation) {
    operationAdjustmentDetails = {
      fromSiteId: inventoryItem.get('siteId'),
    }
  }
  if (operation === receiveOperation) {
    operationAdjustmentDetails = {
      fromSiteId: inventoryItem.get('inTransitFromSiteId'),
      toSiteId: inventoryItem.get('siteId'),
      quantity: inventoryItem.get('quantityOnHand'),
    }
  }
  return dispatch =>
    dispatch({
      type: types.ADJUST_INVENTORY_LEVELS,
      adjustmentDetails: {
        ...adjustmentDetails,
        ...operationAdjustmentDetails,
      },
      operation,
    })
}

export function changeAdjustmentConsumable(consumable) {
  const expiresOn = startOfToday()
  const adjustmentConsumableDetails = {
    consumableId: consumable.get('id'),
    expiresOn: consumable.get('canExpire') === 1
      ? new Date(expiresOn)
      : undefined,
    canExpire: consumable.get('canExpire') === 1,
    consumableName: consumable.get('name'),
    unitShortName: consumable.get('unitShortName'),
  }
  return dispatch =>
    dispatch({
      type: types.CHANGE_ADJUSTMENT_CONSUMABLE,
      adjustmentConsumableDetails,
    })
}

export function addInventoryItem() {
  const adjustmentDetails = {
    inventoryItemId: -1,
    consumableId: -1,
    expiresOn: startOfToday(),
    canExpire: true,
    lotNumber: undefined,
    consumableName: undefined,
    quantity: 0,
    quantityOnHand: 0,
    unitShortName: 'pc',
    notes: '',
    dateAdjusted: startOfToday(),
    dateAdjustedFrom: startOfToday(),
    dateAdjustedTo: startOfToday(),
    toSiteId: -1,
    fromSiteId: -1,
    reasonId: -1,
  }
  return dispatch =>
    dispatch({
      type: types.ADD_INVENTORY_ITEM,
      adjustmentDetails,
    })
}

export function finishAdjustingInventoryLevels() {
  return dispatch =>
    dispatch({
      type: types.FINISH_ADJUSTING_INVENTORY_LEVELS,
    })
}

export function addInventory(inventoryItemId, data) {
  return (dispatch, getState) => {
    const { inventory } = getState()
    const inventoryItem = inventory.getIn(['items', 'byId', inventoryItemId])
    dispatch(startAddingInventory(data))
    if (inventoryItemId > 0) {
      return aspectFetch(`/inventory/add/${inventoryItemId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        errorNotifications: {
          default: errorPleaseTryAgainInAFewMinutes({
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.addInventory.PUT.default.title',
                defaultMessage: 'Adding Inventory Failed',
              },
            }),
            onClose: () =>
              dispatch(adjustInventoryLevels(addOperation, inventoryItem)),
          }),
        },
      })
        .then(() => dispatch(finishAdjustingInventoryLevels()))
        .catch(err => {
          dispatch(finishAdjustingInventoryLevels())
          throw err
        })
    }
    return aspectFetch('/inventory/add', {
      method: 'POST',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.addInventory.POST.default.title',
              defaultMessage: 'Adding Inventory Failed',
            },
          }),
          onClose: () => dispatch(addInventoryItem()),
        }),
      },
    })
      .then(() => dispatch(finishAdjustingInventoryLevels()))
      .catch(err => {
        dispatch(finishAdjustingInventoryLevels())
        throw err
      })
  }
}

export function removeInventory(inventoryItemId, data) {
  return (dispatch, getState) => {
    const { inventory } = getState()
    const inventoryItem = inventory.getIn(['items', 'byId', inventoryItemId])
    dispatch(startRemovingInventory(data))
    return aspectFetch(`/inventory/remove/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.removeInventory.PUT.default.title',
              defaultMessage: 'Removing Inventory Failed',
            },
          }),
          onClose: () =>
            dispatch(adjustInventoryLevels(removeOperation, inventoryItem)),
        }),
      },
    })
      .then(() => dispatch(finishAdjustingInventoryLevels()))
      .catch(err => {
        dispatch(finishAdjustingInventoryLevels())
        throw err
      })
  }
}

export function transferInventory(inventoryItemId, data) {
  return (dispatch, getState) => {
    const { inventory } = getState()
    const inventoryItem = inventory.getIn(['items', 'byId', inventoryItemId])
    dispatch(startTransferringInventory(data))
    return aspectFetch(`/inventory/transfer/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.transferInventory.PUT.default.title',
              defaultMessage: 'Transferring Inventory Failed',
            },
          }),
          onClose: () =>
            dispatch(adjustInventoryLevels(transferOperation, inventoryItem)),
        }),
      },
    })
      .then(() => dispatch(finishAdjustingInventoryLevels()))
      .catch(err => {
        dispatch(finishAdjustingInventoryLevels())
        throw err
      })
  }
}

export function receiveInventory(inventoryItemId, data) {
  return (dispatch, getState) => {
    const { inventory } = getState()
    const inventoryItem = inventory.getIn(['items', 'byId', inventoryItemId])
    dispatch(startReceivingInventory(data))
    return aspectFetch(`/inventory/receive/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.receiveInventory.PUT.default.title',
              defaultMessage: 'Receiving Inventory Failed',
            },
          }),
          onClose: () =>
            dispatch(adjustInventoryLevels(receiveOperation, inventoryItem)),
        }),
      },
    })
      .then(() => dispatch(finishAdjustingInventoryLevels()))
      .catch(err => {
        dispatch(finishAdjustingInventoryLevels())
        throw err
      })
  }
}

/*
 * ---------------- Reducers -----------------
 */
export const AdjustmentDetails = Immutable.Record({
  inventoryItemId: null,
  consumableId: null,
  expiresOn: null,
  canExpire: false,
  lotNumber: '',
  consumableName: '',
  quantity: 0,
  quantityOnHand: 0,
  unitShortName: 0,
  notes: '',
  dateAdjusted: startOfToday(),
  dateAdjustedFrom: startOfToday(),
  dateAdjustedTo: startOfToday(),
  toSiteId: -1,
  fromSiteId: -1,
  reasonId: -1,
})
const InventoryAdjustment = Immutable.Record({
  updating: false,
  operation: null,
  adjustmentDetails: new AdjustmentDetails(),
})
const Inventory = Immutable.Record({
  inventoryAdjustment: new InventoryAdjustment(),
  items: new Items(),
  table: new Table({
    sortCol: 'siteName',
    sortDir: 'asc',
    pageSize: 10,
    filters: Immutable.fromJS({ siteName: '', consumableId: null }),
    extraColumns: new Immutable.List(),
    groupBy: new Immutable.List(['siteId']),
  }),
})

const initialState = new Inventory()

export default function inventoryItemsReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_INVENTORY_ITEMS:
      return state.set('table', requestTable(state.table, action))
    case types.RECEIVE_INVENTORY_ITEMS:
      return state.withMutations(mutState => {
        mutState.set(
          'items',
          receiveList(mutState.items, action.childrenPropertyPath, action.items)
        )
        mutState.set(
          'table',
          receiveTableItems(mutState.table, action.total, action.extraColumns)
        )
      })
    case types.TOGGLE_GROUP_BY_SITE:
      return state.setIn(
        ['table', 'groupBy'],
        action.toggleOn
          ? new Immutable.List(['siteId'])
          : new Immutable.List([])
      )
    case types.ADJUST_INVENTORY_LEVELS:
      return state.mergeDeepIn(['inventoryAdjustment'], {
        operation: action.operation,
        adjustmentDetails: new AdjustmentDetails(action.adjustmentDetails),
      })
    case types.ADD_INVENTORY_ITEM:
      return state.mergeDeepIn(['inventoryAdjustment'], {
        operation: addOperation,
        adjustmentDetails: new AdjustmentDetails(action.adjustmentDetails),
      })
    case types.FINISH_ADJUSTING_INVENTORY_LEVELS:
      return state.mergeDeepIn(['inventoryAdjustment'], {
        updating: false,
        operation: null,
        adjustmentDetails: new AdjustmentDetails(),
      })
    case types.ADD_INVENTORY:
    case types.REMOVE_INVENTORY:
    case types.TRANSFER_INVENTORY:
    case types.RECEIVE_INVENTORY:
      return state.setIn(['inventoryAdjustment', 'updating'], true)
    case types.CHANGE_ADJUSTMENT_CONSUMABLE:
      return state.mergeIn(
        ['inventoryAdjustment', 'adjustmentDetails'],
        action.adjustmentConsumableDetails
      )
    default:
      return state
  }
}
