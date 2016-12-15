import { defineMessages } from 'react-intl'
import _ from 'lodash'
import { stringify } from 'querystring'
import Immutable from 'immutable'
import startOfToday from 'date-fns/start_of_today'

import { aspectFetch } from '../shared/utils/fetch'
import {
  receiveItem,
  receiveList,
  Items
} from '../shared/metaReducers/groupedItems'
import {
  requestTable,
  receiveTableItems,
  Table
} from '../shared/metaReducers/groupedTable'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes
} from '../error/CommonErrorNotifications'

export const types = {
  REQUEST_INVENTORY_ITEMS: 'REQUEST_INVENTORY_ITEMS',
  RECEIVE_INVENTORY_ITEMS: 'RECEIVE_INVENTORY_ITEMS',
  TOGGLE_GROUP_BY_SITE: 'TOGGLE_GROUP_BY_SITE',
  RECEIVE_SINGLE_INVENTORY_ITEM: 'RECEIVE_SINGLE_INVENTORY_ITEM',
  ADJUST_INVENTORY_LEVELS: 'ADJUST_INVENTORY_LEVELS',
  FINISH_ADJUSTING_INVENTORY_LEVELS: 'FINISH_ADJUSTING_INVENTORY_LEVELS',
  ADD_INVENTORY: 'ADD_INVENTORY',
  REMOVE_INVENTORY: 'REMOVE_INVENTORY',
  TRANSFER_INVENTORY: 'TRANSFER_INVENTORY'
}

export const addOperation = 'add'
export const removeOperation = 'remove'
export const transferOperation = 'transfer'

/*
 * ---------------- Action Creators -----------------
 */
function requestInventoryItems(
  sortCol, sortDir, page, size, filters, groupBy) {
  return {
    type: types.REQUEST_INVENTORY_ITEMS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
    groupBy
  }
}

function receiveInventoryItems(json, childrenPropertyPath) {
  return {
    type: types.RECEIVE_INVENTORY_ITEMS,
    items: json.data,
    total: json.total,
    childrenPropertyPath
  }
}

function receiveSingleInventoryItem(item, childrenPropertyPath) {
  return {
    type: types.RECEIVE_SINGLE_INVENTORY_ITEM,
    childrenPropertyPath,
    item
  }
}

function getFilters(state, extraFilters) {
  return state.filter.listFilter.toMap().merge(extraFilters).filter(_.identity).toJS()
}

function getGroupBy(state) {
  return state.inventory.getIn(['table', 'groupBy'])
}

export function toggleGroupBySite(toggleOn) {
  return (dispatch) => {
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

export function fetchInventoryItems(groupBy, filters /* required */, sortCol = 'siteName', sortDir = 'asc', page = 0, pageSize = 10) {
  const groupBySite = groupBy.includes('siteId')
  const path = groupBySite ? '/inventory/group-by-site' : '/inventory'
  return (dispatch) => {
    dispatch(requestInventoryItems(
      sortCol, sortDir, page, pageSize, filters, groupBy))
    return aspectFetch(`${path}?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters
    })}`, {
      errorNotifications: {
        400: filterFieldsRejectedError(defineMessages({
          title: {
            id: 'errorResponseMessages.fetchInventoryItems.GET.400.title',
            defaultMessage: 'Searching Inventory Items Failed'
          }
        })),
        default: errorPleaseTryAgainInAFewMinutes(defineMessages({
          title: {
            id: 'errorResponseMessages.fetchInventoryItems.GET.default.title',
            defaultMessage: 'Loading Inventory Items Failed'
          }
        }))
      }
    }).then(json => dispatch(receiveInventoryItems(json, groupBySite ? ['inventoryItems'] : [])))
  }
}

function startAddingInventory(details) {
  return {
    type: types.ADD_INVENTORY,
    details
  }
}

function startRemovingInventory(details) {
  return {
    type: types.REMOVE_INVENTORY,
    details
  }
}

function startTransferringInventory(details) {
  return {
    type: types.TRANSFER_INVENTORY,
    details
  }
}

export function adjustInventoryLevels(inventoryItem, operation) {
  const expiresOn = inventoryItem.get('expiresOn')
  const adjustmentDetails = {
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
    reasonId: -1
  }
  let operationAdjustmentDetails = {}
  if (operation === addOperation) {
    operationAdjustmentDetails = {
      toSiteId: inventoryItem.get('siteId')
    }
  }
  if (operation === removeOperation) {
    operationAdjustmentDetails = {
      fromSiteId: inventoryItem.get('siteId')
    }
  }
  if (operation === transferOperation) {
    operationAdjustmentDetails = {
      fromSiteId: inventoryItem.get('siteId')
    }
  }
  return dispatch => dispatch({
    type: types.ADJUST_INVENTORY_LEVELS,
    adjustmentDetails: {
      ...adjustmentDetails,
      ...operationAdjustmentDetails
    },
    operation
  })
}

export function finishAdjustingInventoryLevels() {
  return dispatch => dispatch({
    type: types.FINISH_ADJUSTING_INVENTORY_LEVELS
  })
}

// data: { expiresOn, lotNumber, toSiteId, quantity, reasonId, dateAdjusted, notes }
export function addInventory(inventoryItemId, data) {
  return (dispatch, getState) => {
    const { inventory } = getState()
    const groupBySite = inventory.getIn(['table', 'groupBy']).includes('siteId')
    dispatch(startAddingInventory(data))
    const path = groupBySite ? '/inventory/group-by-site/add' : '/inventory/add'
    return aspectFetch(`${path}/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(defineMessages({
          title: {
            id: 'errorResponseMessages.addInventory.PUT.default.title',
            defaultMessage: 'Adjusting Inventory Failed'
          }
        }))
      }
    }).then((json) => {
      dispatch(receiveSingleInventoryItem(json.data, groupBySite ? ['inventoryItems'] : []))
      dispatch(finishAdjustingInventoryLevels())
    })
  }
}

// data: { expiresOn, lotNumber, fromSiteId, quantity, reasonId,
//         dateAdjustedFrom, dateAdjustedTo, notes }
export function removeInventory(inventoryItemId, data) {
  return (dispatch, getState) => {
    const { inventory } = getState()
    const groupBySite = inventory.getIn(['table', 'groupBy']).includes('siteId')
    dispatch(startRemovingInventory(data))
    const path = groupBySite ? '/inventory/group-by-site/remove' : '/inventory/remove'
    return aspectFetch(`${path}/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(defineMessages({
          title: {
            id: 'errorResponseMessages.removeInventory.PUT.default.title',
            defaultMessage: 'Adjusting Inventory Failed'
          }
        }))
      }
    }).then((json) => {
      dispatch(receiveSingleInventoryItem(json.data, groupBySite ? ['inventoryItems'] : []))
      dispatch(finishAdjustingInventoryLevels())
    })
  }
}

// data: { expiresOn, lotNumber, fromSiteId, toSiteId, quantity, dateAdjusted, notes }
export function transferInventory(inventoryItemId, data) {
  return (dispatch, getState) => {
    const { inventory } = getState()
    const groupBySite = inventory.getIn(['table', 'groupBy']).includes('siteId')
    dispatch(startTransferringInventory(data))
    const path = groupBySite ? '/inventory/group-by-site/transfer' : '/inventory/transfer'
    return aspectFetch(`${path}/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(defineMessages({
          title: {
            id: 'errorResponseMessages.transferInventory.PUT.default.title',
            defaultMessage: 'Adjusting Inventory Failed'
          }
        }))
      }
    }).then((json) => {
      dispatch(receiveSingleInventoryItem(json.data.existingInventoryItem, groupBySite ? ['inventoryItems'] : []))
      dispatch(receiveSingleInventoryItem(json.data.newInventoryItem, groupBySite ? ['inventoryItems'] : []))
      dispatch(finishAdjustingInventoryLevels())
    })
  }
}

/*
 * ---------------- Reducers -----------------
 */
const AdjustmentDetails = Immutable.Record({
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
  dateAdjustedTo: startOfToday()
})
const InventoryAdjustment = Immutable.Record({
  updating: false,
  operation: null,
  adjustmentDetails: new AdjustmentDetails()
})
const Inventory = Immutable.Record({
  updating: false,
  currentAdjustmentOperation: null,
  adjustingInventoryItemId: null,

  inventoryAdjustment: new InventoryAdjustment(),
  items: new Items(),
  table: new Table({
    sortCol: 'siteName',
    sortDir: 'asc',
    pageSize: 10,
    filters: Immutable.fromJS({ siteName: '', consumableId: null }),
    extraColumns: new Immutable.List(),
    groupBy: new Immutable.List(['siteId'])
  })
})

const initialState = new Inventory()

export default function inventoryItemsReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_INVENTORY_ITEMS:
      return state
        .set('table', requestTable(state.table, action))
    case types.RECEIVE_INVENTORY_ITEMS:
      return state.withMutations((mutState) => {
        mutState.set('items', receiveList(mutState.items, action.childrenPropertyPath, action.items))
        mutState.set('table', receiveTableItems(mutState.table, action.total, action.extraColumns))
      })
    case types.TOGGLE_GROUP_BY_SITE:
      return state
        .setIn(['table', 'groupBy'],
          action.toggleOn ? new Immutable.List(['siteId']) : new Immutable.List([]))
    case types.ADJUST_INVENTORY_LEVELS:
      return state.mergeDeepIn('inventoryAdjustment', {
        operation: action.operation,
        adjustmentDetails: new AdjustmentDetails(action.adjustmentDetails)
      })
    case types.FINISH_ADJUSTING_INVENTORY_LEVELS:
      return state.mergeDeepIn('inventoryAdjustment', {
        updating: false,
        operation: null,
        adjustmentDetails: new AdjustmentDetails()
      })
    case types.ADD_INVENTORY:
    case types.REMOVE_INVENTORY:
    case types.TRANSFER_INVENTORY:
      return state.setIn(['inventoryAdjustment', 'updating'], true)
    case types.RECEIVE_SINGLE_INVENTORY_ITEM:
      return state.withMutations((mutState) => {
        mutState.set('items', receiveItem(mutState.items, action.childrenPropertyPath, action.item))
      })
    default:
      return state
  }
}
