import { defineMessages } from 'react-intl'
import _ from 'lodash'
import { stringify } from 'querystring'
import Immutable from 'immutable'

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

export function adjustInventoryLevels(inventoryItemId, operation) {
  return dispatch => dispatch({
    type: types.ADJUST_INVENTORY_LEVELS,
    inventoryItemId,
    operation
  })
}

export function finishAdjustingInventoryLevels() {
  return dispatch => dispatch({
    type: types.FINISH_ADJUSTING_INVENTORY_LEVELS
  })
}

// data: { expiryDate, lotNumber, toSiteId, quantity, reasonId, dateAdded, notes }
export function addInventory(inventoryItemId, data) {
  return (dispatch, getState) => {
    const { inventory } = getState()
    const groupBySite = inventory.getIn(['table', 'groupBy']).includes('siteId')
    dispatch(startAddingInventory(data))
    const path = groupBySite ? '/inventory/group-by-site/add' : '/inventory/add'
    return aspectFetch(`${path}/${inventoryItemId}`)
      .then((json) => {
        dispatch(receiveSingleInventoryItem(json.data, groupBySite ? ['inventoryItems'] : []))
        dispatch(finishAdjustingInventoryLevels())
      })
      .catch((err) => {
        dispatch(addError('Adding inventory failed', err.message, err))
      })
  }
}

// data: { expiryDate, lotNumber, fromSiteId, quantity, reasonId,
//         dateRemovedFrom, dateRemovedTo, notes }
export function removeInventory(inventoryItemId, data) {
  return (dispatch, getState) => {
    const { inventory } = getState()
    const groupBySite = inventory.getIn(['table', 'groupBy']).includes('siteId')
    dispatch(startRemovingInventory(data))
    const path = groupBySite ? '/inventory/group-by-site/remove' : '/inventory/remove'
    return aspectFetch(`${path}/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }).then((json) => {
      dispatch(receiveSingleInventoryItem(json.data, groupBySite ? ['inventoryItems'] : []))
      dispatch(finishAdjustingInventoryLevels())
    }).catch((err) => {
      dispatch(addError('Removing inventory failed', err.message, err))
    })
  }
}

// data: { expiryDate, lotNumber, fromSiteId, toSiteId, quantity, dateTransferred, notes }
export function transferInventory(inventoryItemId, data) {
  return (dispatch, getState) => {
    const { inventory } = getState()
    const groupBySite = inventory.getIn(['table', 'groupBy']).includes('siteId')
    dispatch(startTransferringInventory(data))
    const path = groupBySite ? '/inventory/group-by-site/transfer' : '/inventory/transfer'
    return aspectFetch(`${path}/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }).then((json) => {
      dispatch(receiveSingleInventoryItem(json.data.existingInventoryItem, groupBySite ? ['inventoryItems'] : []))
      dispatch(receiveSingleInventoryItem(json.data.newInventoryItem, groupBySite ? ['inventoryItems'] : []))
      dispatch(finishAdjustingInventoryLevels())
    }).catch((err) => {
      dispatch(addError('Transferring inventory failed', err.message, err))
    })
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Inventory = Immutable.Record({
  updating: false,
  currentAdjustmentOperation: null,
  adjustingInventoryItemId: null,
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
      return state.withMutations((mutState) => {
        mutState.set('currentAdjustmentOperation', action.operation)
        mutState.set('adjustingInventoryItemId', action.inventoryItemId)
      })
    case types.FINISH_ADJUSTING_INVENTORY_LEVELS:
      return state.withMutations((mutState) => {
        mutState.set('currentAdjustmentOperation', null)
        mutState.set('adjustingInventoryItemId', null)
        mutState.set('updating', false)
      })
    case types.ADD_INVENTORY:
    case types.REMOVE_INVENTORY:
    case types.TRANSFER_INVENTORY:
      return state.set('updating', true)
    case types.RECEIVE_SINGLE_INVENTORY_ITEM:
      return state.withMutations((mutState) => {
        mutState.set('items', receiveItem(mutState.items, action.childrenPropertyPath, action.item))
      })
    default:
      return state
  }
}
