import isString from 'lodash/isString'
import fromPairs from 'lodash/fromPairs'
import { defineMessages } from 'react-intl'
import { stringify } from 'querystring'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import fetchWrapperForQueries from '../MigratedComponents/QueryFetch'
import { receiveList, Items } from '../shared/metaReducers/groupedItems'
import {
  requestTable,
  receiveTableItems,
  Table,
} from '../shared/metaReducers/groupedTable'
import {
  filterFieldsRejectedError,
  errorPleaseTryAgainInAFewMinutes,
  errorForbidden,
} from '../error/CommonErrorNotifications'
import { receivedExportResponse } from '../globals/GlobalsRedux'

export const types = {
  REQUEST_INVENTORY_ITEMS: 'REQUEST_INVENTORY_ITEMS',
  RECEIVE_INVENTORY_ITEMS: 'RECEIVE_INVENTORY_ITEMS',
  REJECTED_INVENTORY_ITEMS: 'REJECTED_INVENTORY_ITEMS',
  TOGGLE_GROUP_BY_SITE: 'TOGGLE_GROUP_BY_SITE',

  RECEIVE_UPDATED_SINGLE_INVENTORY_ITEM:
    'RECEIVE_UPDATED_SINGLE_INVENTORY_ITEM',

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
function receiveInventoryItems(json, childrenPropertyPath) {
  return {
    type: types.RECEIVE_INVENTORY_ITEMS,
    items: json.data,
    total: json.total,
    childrenPropertyPath,
  }
}

function toggleGroupBySite(toggleOn) {
  return { type: types.TOGGLE_GROUP_BY_SITE, toggleOn }
}

function showNewInventoryDialog() {
  return {
    type: types.SHOW_NEW_INVENTORY_DIALOG,
  }
}

function showAddInventoryDialog(inventoryItemId) {
  return {
    type: types.SHOW_ADD_INVENTORY_DIALOG,
    inventoryItemId,
  }
}

function showRemoveInventoryDialog(inventoryItemId) {
  return {
    type: types.SHOW_REMOVE_INVENTORY_DIALOG,
    inventoryItemId,
  }
}

function showTransferInventoryDialog(inventoryItemId) {
  return {
    type: types.SHOW_TRANSFER_INVENTORY_DIALOG,
    inventoryItemId,
  }
}

function showReceiveInventoryDialog(inventoryItemId) {
  return {
    type: types.SHOW_RECEIVE_INVENTORY_DIALOG,
    inventoryItemId,
  }
}

function hideAdjustInventoryDialog() {
  return {
    type: types.HIDE_ADJUST_INVENTORY_DIALOG,
  }
}

function exportSupplies(
  filtersParams,
  sortCol,
  sortDir,
  page,
  size,
  fileFormat,
  reportName,
  dispatch
) {
  const filters = fromPairs([...filtersParams.entries()])
  return fetchWrapperForQueries({
    endpoint: '/inventory/export',
    params: {
      sortCol,
      sortDir,
      page,
      size,
      format: fileFormat,
      ...filters,
    },
    customErrorNotifications: {
      400: filterFieldsRejectedError(
        defineMessages({
          title: {
            id: 'errorResponseMessages.exportSupplies.GET.400.title',
            defaultMessage: 'Exporting Supplies Failed',
          },
        })
      ),
      default: errorPleaseTryAgainInAFewMinutes(
        defineMessages({
          title: {
            id: 'errorResponseMessages.exportSupplies.GET.default.title',
            defaultMessage: 'Exporting Supplies Failed',
          },
        })
      ),
    },
  }).then(async elem => {
    const file = await elem.blob
    dispatch(receivedExportResponse(file, fileFormat, reportName))
  })
}

function addInventory(data, dispatch, inventoryState) {
  const {
    items,
    inventoryAdjustment: { inventoryItemId },
  } = inventoryState

  if (isString(inventoryItemId)) {
    const consumableId = items.getIn(['byId', inventoryItemId, 'consumableId'])

    return fetchWrapperForQueries({
      endpoint: `/inventory/add/${inventoryItemId}`,
      method: 'PUT',
      params: { ...data, consumableId },
      customErrorNotifications: {
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
  return fetchWrapperForQueries({
    endpoint: '/inventory/add',
    method: 'POST',
    params: data,
    customErrorNotifications: {
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

function removeInventory(data, dispatch, inventoryState) {
  const {
    items,
    inventoryAdjustment: { inventoryItemId },
  } = inventoryState
  const consumableId = items.getIn(['byId', inventoryItemId, 'consumableId'])

  return fetchWrapperForQueries({
    endpoint: `/inventory/remove/${inventoryItemId}`,
    method: 'PUT',
    params: {
      ...data,
      consumableId,
    },
    customErrorNotifications: {
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

function transferInventory(data, dispatch, inventoryState) {
  const {
    items,
    inventoryAdjustment: { inventoryItemId },
  } = inventoryState
  const consumableId = items.getIn(['byId', inventoryItemId, 'consumableId'])

  return fetchWrapperForQueries({
    endpoint: `/inventory/transfer/${inventoryItemId}`,
    method: 'PUT',
    params: {
      ...data,
      consumableId,
    },
    customErrorNotifications: {
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

function receiveInventory(data, dispatch, inventoryState) {
  const {
    items,
    inventoryAdjustment: { inventoryItemId },
  } = inventoryState

  const consumableId = items.getIn(['byId', inventoryItemId, 'consumableId'])
  return fetchWrapperForQueries({
    endpoint: `/inventory/receive/${inventoryItemId}`,
    method: 'PUT',
    params: {
      ...data,
      consumableId,
    },
    customErrorNotifications: {
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

function updateStockLevel(siteId, consumableId, data) {
  return () =>
    aspectFetch(`/inventory/${siteId}/${consumableId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
      }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          ...defineMessages({
            title: {
              id: 'errorResponseMessages.updateInventory.PUT.default.title',
              defaultMessage: 'Updating Inventory Failed',
            },
          }),
        }),
      },
    })
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
    extraColumns: Immutable.List(),
    groupBy: Immutable.List(['siteId']),
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
    case types.REJECTED_INVENTORY_ITEMS:
      return state.withMutations(mutState => {
        mutState.set('items', mutState.get('items').clear())
        mutState.set('table', mutState.get('table').clear())
      })
    case types.TOGGLE_GROUP_BY_SITE:
      return state.setIn(
        ['table', 'groupBy'],
        action.toggleOn ? Immutable.List(['siteId']) : Immutable.List([])
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

export {
  receiveInventoryItems,
  toggleGroupBySite,
  showNewInventoryDialog,
  showAddInventoryDialog,
  showRemoveInventoryDialog,
  showTransferInventoryDialog,
  showReceiveInventoryDialog,
  hideAdjustInventoryDialog,
  exportSupplies,
  addInventory,
  removeInventory,
  transferInventory,
  receiveInventory,
  updateStockLevel,
}
