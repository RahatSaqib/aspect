import { stringify } from 'querystring'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'
import { receiveList, Items } from '../shared/metaReducers/groupedItems'
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

function receiveInventoryItems(json, nestedPropertyPath) {
  return {
    type: types.RECEIVE_INVENTORY_ITEMS,
    items: json.data,
    total: json.total,
    nestedPropertyPath
  }
}

const defaultFilters = Immutable.Map({ consumableId: '', siteName: '' })
const defaultSortCol = 'siteName'
const defaultSortDir = 'asc'
const defaultPage = 0
const defaultPageSize = 10
const defaultGroupBy = new Immutable.List()

export function fetchInventoryItems(
  filters = defaultFilters, sortCol = defaultSortCol, sortDir = defaultSortDir,
  page = defaultPage, pageSize = defaultPageSize, groupBy = defaultGroupBy) {
  const path = groupBy.includes('siteId') ? (groupBy.includes('consumableId') ?
    '/inventory/group-by-site-and-consumable' : '/inventory/group-by-site') : '/inventory'
  return (dispatch) => {
    dispatch(requestInventoryItems(
      sortCol, sortDir, page, pageSize, filters, groupBy))
    return aspectFetch(`${path}?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters.toJS()
    })}`)
      .then((json) => {
        const nestedPropertyPath = []
        if (groupBy.includes('siteId')) {
          nestedPropertyPath.push('consumables')
        }
        if (groupBy.includes('consumableId')) {
          nestedPropertyPath.push('inventoryItems')
        }
        return dispatch(receiveInventoryItems(json, nestedPropertyPath))
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
    sortCol: defaultSortCol,
    sortDir: defaultSortDir,
    pageSize: defaultPageSize,
    filters: defaultFilters,
    groupBy: defaultGroupBy
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
        mutState.set('items', receiveList(mutState.items, action.nestedPropertyPath, action.items))
        mutState.set('table', receiveTableItems(mutState.table, action.total, action.extraColumns))
      })
    default:
      return state
  }
}
