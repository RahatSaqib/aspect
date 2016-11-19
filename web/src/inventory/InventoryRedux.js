import _ from 'lodash'
import { stringify } from 'querystring'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'
import {
  receiveList,
  Items
} from '../shared/metaReducers/groupedItems'
import {
  requestTable,
  receiveTableItems,
  Table
} from '../shared/metaReducers/groupedTable'

export const types = {
  REQUEST_INVENTORY_ITEMS: 'REQUEST_INVENTORY_ITEMS',
  RECEIVE_INVENTORY_ITEMS: 'RECEIVE_INVENTORY_ITEMS'
}
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

export function fetchListFilteredInventoryItems(groupBy, extraFilters = {}, ...args) {
  return (dispatch, getState) => {
    const filters = getState()
      .filter
      .listFilter
      .toMap()
      .merge(extraFilters)
      .filter(_.identity)
      .toJS()

    return dispatch(fetchInventoryItems(filters, groupBy, ...args))
  }
}

export function fetchInventoryItems(filters, groupBy /* required */, sortCol = 'siteName', sortDir = 'asc', page = 0, pageSize = 10) {
  const path = groupBy && groupBy.includes('siteId') ? (groupBy.includes('consumableId') ?
    '/inventory/group-by-site-and-consumable' : '/inventory/group-by-site') : '/inventory'
  return (dispatch) => {
    dispatch(requestInventoryItems(
      sortCol, sortDir, page, pageSize, filters, groupBy))
    return aspectFetch(`${path}?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters
    })}`)
      .then((json) => {
        const childrenPropertyPath = groupBy &&
        groupBy.includes('siteId') &&
        groupBy.includes('consumableId') ? ['consumables', 'inventoryItems'] :
          (groupBy && groupBy.includes('siteId') ? ['inventoryItems'] : [])
        return dispatch(receiveInventoryItems(json, childrenPropertyPath))
      })
      .catch((err) => {
        dispatch(addError('Loading inventory items failed', err.message, err))
      })
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Inventory = Immutable.Record({
  items: new Items(),
  table: new Table({
    sortCol: 'siteName',
    sortDir: 'asc',
    pageSize: 10,
    filters: Immutable.fromJS({ siteName: '', consumableId: null }),
    extraColumns: new Immutable.List(),
    groupBy: new Immutable.List(['siteId', 'consumableId'])
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
    default:
      return state
  }
}
