import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import fetchWrapperForQueries from '../components/QueryFetch'
import { badRequestBuilder, errorPleaseTryAgainInAFewMinutes } from '../utils/error/CommonErrorNotifications'
import { Items, receiveList } from '../utils/metaReducers/groupedItems'
import { Table, receiveTableItems, requestTable } from '../utils/metaReducers/groupedTable'

export const types = {
  REQUEST_INVENTORY_ITEMS: 'REQUEST_INVENTORY_ITEMS',
  RECEIVE_INVENTORY_ITEMS: 'RECEIVE_INVENTORY_ITEMS',
  REJECTED_INVENTORY_ITEMS: 'REJECTED_INVENTORY_ITEMS',
  TOGGLE_GROUP_BY_SITE: 'TOGGLE_GROUP_BY_SITE',

  RECEIVE_UPDATED_SINGLE_INVENTORY_ITEM: 'RECEIVE_UPDATED_SINGLE_INVENTORY_ITEM',

  SHOW_NEW_INVENTORY_DIALOG: 'SHOW_NEW_INVENTORY_DIALOG',
  SHOW_ADD_INVENTORY_DIALOG: 'SHOW_ADD_INVENTORY_DIALOG',
  SHOW_REMOVE_INVENTORY_DIALOG: 'SHOW_REMOVE_INVENTORY_DIALOG',
  SHOW_TRANSFER_INVENTORY_DIALOG: 'SHOW_TRANSFER_INVENTORY_DIALOG',
  SHOW_RECEIVE_INVENTORY_DIALOG: 'SHOW_RECEIVE_INVENTORY_DIALOG',

  HIDE_ADJUST_INVENTORY_DIALOG: 'HIDE_ADJUST_INVENTORY_DIALOG',
}

function getErrorsForRemove() {
  const messages = defineMessages({
    missingInventoryItemTitle: {
      id: 'errorResponseMessages.removeInventory.PUT.missingInventoryItem.title',
      defaultMessage: 'Removing Inventory Failed',
    },
    missingInventoryItem: {
      id: 'errorResponseMessages.removeInventory.PUT.missingInventoryItem.resolution',
      defaultMessage: 'Can not deduct from non-existed inventory item.',
    },
    negativeQuantityTitle: {
      id: 'errorResponseMessages.removeInventory.PUT.negativeQuantity.title',
      defaultMessage: 'Removing Inventory Failed',
    },
    negativeQuantity: {
      id: 'errorResponseMessages.removeInventory.PUT.negativeQuantity.resolution',
      defaultMessage: 'Quantity is negative for current inventory.',
    },
    notEnoughInventoryTitle: {
      id: 'errorResponseMessages.removeInventory.PUT.notEnoughInventory.title',
      defaultMessage: 'Removing Inventory Failed',
    },
    notEnoughInventory: {
      id: 'errorResponseMessages.removeInventory.PUT.notEnoughInventory.resolution',
      defaultMessage: 'Not enough inventory items on the site to remove.',
    },
  })

  return {
    404: badRequestBuilder(messages),
  }
}

function getErrorsForTransfer() {
  const messages = defineMessages({
    missingInventoryItemTitle: {
      id: 'errorResponseMessages.transferInventory.transfer.missingInventoryItem.PUT.title',
      defaultMessage: 'Transferring Inventory Failed',
    },
    missingInventoryItem: {
      id: 'errorResponseMessages.transferInventory.transfer.PUT.missingInventoryItem.resolution',
      defaultMessage: 'Can not deduct from non-existed inventory item.',
    },
    negativeQuantityTitle: {
      id: 'errorResponseMessages.transferInventory.transfer.negativeQuantity.negativeQuantity.PUT.title',
      defaultMessage: 'Transferring Inventory Failed',
    },
    negativeQuantity: {
      id: 'errorResponseMessages.transferInventory.transfer.PUT.negativeQuantity.resolution',
      defaultMessage: 'Quantity is negative for current inventory.',
    },
    notEnoughInventoryTitle: {
      id: 'errorResponseMessages.transferInventory.transfer.notEnoughInventory.PUT.title',
      defaultMessage: 'Transferring Inventory Failed',
    },
    notEnoughInventory: {
      id: 'errorResponseMessages.transferInventory.transfer.PUT.notEnoughInventory.resolution',
      defaultMessage: 'Not enough inventory items on the site to remove.',
    },
  })

  return {
    404: badRequestBuilder(messages),
  }
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

function addInventory(data, dispatch, inventoryState) {
  const {
    items,
    inventoryAdjustment: { inventoryItemId },
  } = inventoryState

  if (!data.consumableId && inventoryItemId) data.consumableId = items.getIn(['byId', inventoryItemId, 'consumableId'])

  return fetchWrapperForQueries({
    endpoint: '/inventory/add',
    method: 'PUT',
    params: data,
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

function removeInventory(data, dispatch, inventoryState) {
  const {
    items,
    inventoryAdjustment: { inventoryItemId },
  } = inventoryState
  const consumableId = items.getIn(['byId', inventoryItemId, 'consumableId'])

  return fetchWrapperForQueries({
    endpoint: '/inventory/remove',
    method: 'PUT',
    params: {
      ...data,
      consumableId,
    },
    customErrorNotifications: {
      ...getErrorsForRemove(),
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
    endpoint: '/inventory/transfer',
    method: 'PUT',
    params: {
      ...data,
      consumableId,
    },
    customErrorNotifications: {
      ...getErrorsForTransfer(),
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
    endpoint: '/inventory/receive',
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

function modifyInventoryOnHand(data, itemState) {
  const { siteId } = itemState
  const { consumableId } = itemState
  const { lotNumber } = itemState
  return fetchWrapperForQueries({
    endpoint: '/inventory/on-hand',
    method: 'PUT',
    params: {
      siteId,
      consumableId,
      lotNumber,
      ...data,
    },
    customErrorNotifications: {
      default: errorPleaseTryAgainInAFewMinutes({
        ...defineMessages({
          title: {
            id: 'errorResponseMessages.addInventory.PUT.default.title',
            defaultMessage: 'Adding Inventory Failed',
          },
        }),
      }),
    },
  }).catch(err => {
    throw err
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
        mutState.set('items', receiveList(mutState.items, action.childrenPropertyPath, action.items))
        mutState.set('table', receiveTableItems(mutState.table, action.total, action.extraColumns))
      })
    case types.REJECTED_INVENTORY_ITEMS:
      return state.withMutations(mutState => {
        mutState.set('items', mutState.get('items').clear())
        mutState.set('table', mutState.get('table').clear())
      })
    case types.TOGGLE_GROUP_BY_SITE:
      return state.setIn(['table', 'groupBy'], action.toggleOn ? Immutable.List(['siteId']) : Immutable.List([]))
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
  addInventory,
  hideAdjustInventoryDialog,
  modifyInventoryOnHand,
  receiveInventory,
  receiveInventoryItems,
  removeInventory,
  showAddInventoryDialog,
  showNewInventoryDialog,
  showReceiveInventoryDialog,
  showRemoveInventoryDialog,
  showTransferInventoryDialog,
  transferInventory,
}
