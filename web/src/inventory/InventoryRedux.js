import _ from 'lodash'
import { defineMessages } from 'react-intl'
import { stringify } from 'querystring'
import Immutable from 'immutable'

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

  SHOW_NEW_INVENTORY_DIALOG: 'SHOW_NEW_INVENTORY_DIALOG',
  SHOW_ADD_INVENTORY_DIALOG: 'SHOW_ADD_INVENTORY_DIALOG',
  SHOW_REMOVE_INVENTORY_DIALOG: 'SHOW_REMOVE_INVENTORY_DIALOG',
  SHOW_TRANSFER_INVENTORY_DIALOG: 'SHOW_TRANSFER_INVENTORY_DIALOG',
  SHOW_RECEIVE_INVENTORY_DIALOG: 'SHOW_RECEIVE_INVENTORY_DIALOG',

  HIDE_ADJUST_INVENTORY_DIALOG: 'HIDE_ADJUST_INVENTORY_DIALOG',
}
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

function getFilters(state) {
  return state.filter.listFilter.toMap().filter(nonEmptyFilterValue).toJS()
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

export function fetchListFilteredInventoryItems(...args) {
  return (dispatch, getState) => {
    const groupBy = getGroupBy(getState())
    const filters = getFilters(getState())
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
                id:
                  'errorResponseMessages.fetchInventoryItems.GET.default.title',
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

export function showNewInventoryDialog() {
  return {
    type: types.SHOW_NEW_INVENTORY_DIALOG,
  }
}

export function showAddInventoryDialog(inventoryItemId) {
  return {
    type: types.SHOW_ADD_INVENTORY_DIALOG,
    inventoryItemId,
  }
}

export function showRemoveInventoryDialog(inventoryItemId) {
  return {
    type: types.SHOW_REMOVE_INVENTORY_DIALOG,
    inventoryItemId,
  }
}

export function showTransferInventoryDialog(inventoryItemId) {
  return {
    type: types.SHOW_TRANSFER_INVENTORY_DIALOG,
    inventoryItemId,
  }
}

export function showReceiveInventoryDialog(inventoryItemId) {
  return {
    type: types.SHOW_RECEIVE_INVENTORY_DIALOG,
    inventoryItemId,
  }
}

export function hideAdjustInventoryDialog() {
  return {
    type: types.HIDE_ADJUST_INVENTORY_DIALOG,
  }
}

export function addInventory(data) {
  return (dispatch, getState) => {
    const {
      items,
      inventoryAdjustment: { inventoryItemId },
    } = getState().inventory

    if (_.isString(inventoryItemId)) {
      const consumableId = items.getIn([
        'byId',
        inventoryItemId,
        'consumableId',
      ])

      return aspectFetch(`/inventory/add/${inventoryItemId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          consumableId,
        }),
        errorNotifications: {
          default: errorPleaseTryAgainInAFewMinutes({
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.addInventory.PUT.default.title',
                defaultMessage: 'Adding Inventory Failed',
              },
            }),
            onClose: () => dispatch(showAddInventoryDialog(inventoryItemId)),
          }),
        },
      })
        .then(() => dispatch(hideAdjustInventoryDialog()))
        .catch(err => {
          dispatch(hideAdjustInventoryDialog())
          throw err
        })
    }
    // new
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
          onClose: () => dispatch(showNewInventoryDialog()),
        }),
      },
    })
      .then(() => dispatch(hideAdjustInventoryDialog()))
      .catch(err => {
        dispatch(hideAdjustInventoryDialog())
        throw err
      })
  }
}

export function removeInventory(data) {
  return (dispatch, getState) => {
    const {
      items,
      inventoryAdjustment: { inventoryItemId },
    } = getState().inventory
    const consumableId = items.getIn(['byId', inventoryItemId, 'consumableId'])

    return aspectFetch(`/inventory/remove/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        consumableId,
      }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.removeInventory.PUT.default.title',
              defaultMessage: 'Removing Inventory Failed',
            },
          }),
          onClose: () => dispatch(showRemoveInventoryDialog(inventoryItemId)),
        }),
      },
    })
      .then(() => dispatch(hideAdjustInventoryDialog()))
      .catch(err => {
        dispatch(hideAdjustInventoryDialog())
        throw err
      })
  }
}

export function transferInventory(data) {
  return (dispatch, getState) => {
    const {
      items,
      inventoryAdjustment: { inventoryItemId },
    } = getState().inventory
    const consumableId = items.getIn(['byId', inventoryItemId, 'consumableId'])

    return aspectFetch(`/inventory/transfer/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        consumableId,
      }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.transferInventory.PUT.default.title',
              defaultMessage: 'Transferring Inventory Failed',
            },
          }),
          onClose: () => dispatch(showTransferInventoryDialog(inventoryItemId)),
        }),
      },
    })
      .then(() => dispatch(hideAdjustInventoryDialog()))
      .catch(err => {
        dispatch(hideAdjustInventoryDialog())
        throw err
      })
  }
}

export function receiveInventory(data) {
  return (dispatch, getState) => {
    const {
      items,
      inventoryAdjustment: { inventoryItemId },
    } = getState().inventory
    const consumableId = items.getIn(['byId', inventoryItemId, 'consumableId'])

    return aspectFetch(`/inventory/receive/${inventoryItemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        consumableId,
      }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.receiveInventory.PUT.default.title',
              defaultMessage: 'Receiving Inventory Failed',
            },
          }),
          onClose: () => dispatch(showReceiveInventoryDialog(inventoryItemId)),
        }),
      },
    })
      .then(() => dispatch(hideAdjustInventoryDialog()))
      .catch(err => {
        dispatch(hideAdjustInventoryDialog())
        throw err
      })
  }
}

/*
 * ---------------- Reducers -----------------
 */
const InventoryAdjustment = Immutable.Record({
  actionType: undefined,
  inventoryItemId: undefined,
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
    case types.SHOW_NEW_INVENTORY_DIALOG:
    case types.SHOW_ADD_INVENTORY_DIALOG:
    case types.SHOW_REMOVE_INVENTORY_DIALOG:
    case types.SHOW_TRANSFER_INVENTORY_DIALOG:
    case types.SHOW_RECEIVE_INVENTORY_DIALOG:
      return state.mergeDeepIn(['inventoryAdjustment'], {
        actionType: action.type,
        inventoryItemId: action.inventoryItemId,
      })
    case types.HIDE_ADJUST_INVENTORY_DIALOG:
      return state.mergeDeepIn(['inventoryAdjustment'], {
        actionType: null,
        inventoryItemId: null,
      })
    default:
      return state
  }
}
