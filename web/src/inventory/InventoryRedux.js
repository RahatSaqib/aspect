import { defineMessages } from 'react-intl'
import _ from 'lodash'
import { stringify } from 'querystring'
import Immutable from 'immutable'

import { aspectFetch } from '../shared/utils/fetch'
import {
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
  TOGGLE_GROUP_BY_SITE: 'TOGGLE_GROUP_BY_SITE'
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
    default:
      return state
  }
}
