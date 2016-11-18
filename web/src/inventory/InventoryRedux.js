import { stringify } from 'querystring'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'
import { receiveList, Items } from '../shared/metaReducers/groupedItems'

export const types = {
  REQUEST_INVENTORY_ITEMS: 'REQUEST_INVENTORY_ITEMS',
  RECEIVE_INVENTORY_ITEMS: 'RECEIVE_INVENTORY_ITEMS'
}
/*
 * ---------------- Action Creators -----------------
 */
function requestInventoryItems(
  sortCol, sortDir, page, size, filters, groupBySite, groupByConsumable) {
  return {
    type: types.REQUEST_INVENTORY_ITEMS,
    sortCol,
    sortDir,
    page,
    size,
    filters,
    groupBySite,
    groupByConsumable
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
const defaultGroupBySite = false
const defaultGroupByConsumable = false

export function fetchInventoryItems(
  filters = defaultFilters, sortCol = defaultSortCol, sortDir = defaultSortDir,
  page = defaultPage, pageSize = defaultPageSize, groupBySite = defaultGroupBySite,
  groupByConsumable = defaultGroupByConsumable) {
  const path = groupBySite ? (groupByConsumable ? '/inventory/group-by-site-and-consumable' : '/inventory/group-by-site') : '/inventory'
  return (dispatch) => {
    dispatch(requestInventoryItems(
      sortCol, sortDir, page, pageSize, filters, groupBySite, groupByConsumable))
    return aspectFetch(`${path}?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters.toJS()
    })}`)
      .then((json) => {
        const nestedPropertyPath = []
        if (groupByConsumable) {
          nestedPropertyPath.push('consumables')
        }
        if (groupBySite) {
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
export const InventoryTable = Immutable.Record({
  loading: false,
  sortCol: defaultSortCol,
  sortDir: defaultSortDir,
  page: 0,
  pageSize: defaultPageSize,
  total: 0,
  filters: defaultFilters,
  groupBySite: defaultGroupBySite,
  groupByConsumable: defaultGroupByConsumable
})

const Inventory = Immutable.Record({
  items: new Items(),
  table: new InventoryTable()
})

const initialState = new Inventory()

export default function inventoryItemsReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_INVENTORY_ITEMS:
      return state.set('table', state.table.merge({
        loading: true,
        sortCol: action.sortCol,
        sortDir: action.sortDir,
        page: action.page,
        pageSize: action.size,
        filters: action.filters,
        groupBySite: action.groupBySite,
        groupByConsumable: action.groupByConsumable
      }))
    case types.RECEIVE_INVENTORY_ITEMS:
      return state.withMutations((mutState) => {
        mutState.set('items', receiveList(mutState.items, action.nestedPropertyPath, action.items))
        mutState.set('table', mutState.table.merge({
          loading: false,
          total: action.total
        }))
      })
    default:
      return state
  }
}
