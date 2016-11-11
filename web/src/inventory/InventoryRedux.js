import { stringify } from 'querystring'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'
import { receiveList, Items } from '../shared/metaReducers/items'
import { requestTable, receiveTableItems, Table } from '../shared/metaReducers/table'

export const types = {
  REQUEST_INVENTORY_ITEMS: 'REQUEST_INVENTORY_ITEMS',
  RECEIVE_INVENTORY_ITEMS: 'RECEIVE_INVENTORY_ITEMS'
}
/*
 * ---------------- Action Creators -----------------
 */
function requestInventoryItems(sortCol, sortDir, page, size, filters, groupBySite, groupByConsumable) {
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

function receiveInventoryItems(json) {
  return {
    type: types.RECEIVE_INVENTORY_ITEMS,
    items: json.data,
    total: json.total
  }
}

const defaultFilters = Immutable.Map({ consumableId: '', siteName: '' })
const defaultSortCol = 'siteName'
const defaultSortDir = 'asc'
const defaultPage = 0
const defaultPageSize = 0
const defaultGroupBySite = false
const defaultGroupByConsumable = false

export function fetchInventoryItems(filters = defaultFilters, sortCol = defaultSortCol, sortDir = defaultSortDir,
                                    page = defaultPage, pageSize = defaultPageSize, groupBySite = defaultGroupBySite,
                                    groupByConsumable = defaultGroupByConsumable) {
  const path = groupBySite ? '/inventory/group-by-site' : '/inventory'
  return dispatch => {

    dispatch(requestInventoryItems(sortCol, sortDir, page, pageSize, filters, groupBySite, groupByConsumable))

    return aspectFetch(`${path}?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters.toJS()
    })}`)
      .then(json => dispatch(receiveInventoryItems(json)))
      .catch(err => {
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
    pageSize: defaultPage,
    filters: defaultFilters,
    groupBySite: defaultGroupBySite,
    groupByConsumable: defaultGroupByConsumable
  })
})

const initialState = new Inventory()

export default function inventoryItemsReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_INVENTORY_ITEMS:
    return state.set('table', requestTable(state.table, action).merge({
      groupBySite: action.groupBySite,
      groupByConsumable: action.groupByConsumable
    }))
  case types.RECEIVE_INVENTORY_ITEMS:
    return state.withMutations(mutState => {
      const immutList = Immutable.fromJS(action.items)
      mutState.set('items', receiveList(mutState.items, immutList))
      mutState.set('table', receiveTableItems(mutState.table, action.total))
    })
  }
  return state
}
