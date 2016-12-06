import _ from 'lodash'
import Immutable from 'immutable'
import { stringify } from 'querystring'

import { aspectFetch } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'

import {
  receiveList,
  receiveItem,
  Items
} from '../shared/metaReducers/items'
import {
  requestTable,
  receiveTableItems,
  Table
} from '../shared/metaReducers/table'

export const types = {
  REQUEST_ROUTERS: 'REQUEST_ROUTERS',
  RECEIVE_ROUTERS: 'RECEIVE_ROUTERS',

  REQUEST_SINGLE_ROUTER: 'REQUEST_SINGLE_ROUTER',
  RECEIVE_SINGLE_ROUTER: 'RECEIVE_SINGLE_ROUTER',

  REQUEST_UPDATING_SINGLE_ROUTER: 'REQUEST_UPDATING_SINGLE_ROUTER',
  RECEIVE_UPDATED_SINGLE_ROUTER: 'RECEIVE_UPDATED_SINGLE_ROUTER'
}
/*
 * ---------------- Action Creators -----------------
 */
function requestRouters(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_ROUTERS,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receiveRouters(json) {
  return {
    type: types.RECEIVE_ROUTERS,
    items: json.data,
    total: json.total
  }
}

// With state.filter.listFilter & extraFilters
export function fetchListFilteredRouters(extraFilters = {}, ...args) {
  return (dispatch, getState) => {
    const filters = getState()
      .filter
      .listFilter
      .toMap()
      .merge(extraFilters)
      .filter(_.identity)
      .toJS()

    return dispatch(fetchRouters(filters, ...args))
  }
}

export function fetchRouters(filters/* required */, sortCol = 'name', sortDir = 'asc', page = 0, pageSize = 10) {
  return (dispatch) => {
    dispatch(requestRouters(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(`/device?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters
    })}`)
      .then(json => dispatch(receiveRouters(json)))
      .catch((err) => {
        dispatch(addError('Loading routers failed', err.message, err))
      })
  }
}

function requestSingleRouter(routerId) {
  return {
    type: types.REQUEST_SINGLE_ROUTER,
    routerId
  }
}

function receiveSingleRouter(item) {
  return {
    type: types.RECEIVE_SINGLE_ROUTER,
    item
  }
}

export function fetchSingleRouter(routerId) {
  return (dispatch) => {
    dispatch(requestSingleRouter(routerId))

    return aspectFetch(`/device/${routerId}`)
      .then(json => dispatch(receiveSingleRouter(json.data)))
      .catch((err) => {
        dispatch(addError(`Loading a device (${routerId}) failed`, err.message, err))
      })
  }
}

function requestUpdatingSingleRouter(routerId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_ROUTER,
    routerId,
    data
  }
}

function receiveUpdatedSingleRouter(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_ROUTER,
    item
  }
}

export function updateSingleRouter(routerId, data) {
  return (dispatch) => {
    dispatch(requestUpdatingSingleRouter(routerId, data))

    return aspectFetch(`/device/${routerId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
      .then(json => dispatch(receiveUpdatedSingleRouter(json.data)))
      .catch((err) => {
        dispatch(addError(`Updating a router (${routerId}) failed`, err.message, err))
      })
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Router = Immutable.Record({
  items: new Items(),
  table: new Table()
})

const initialState = new Router()

export default function routerReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_ROUTERS:
      return state
      .set('table', requestTable(state.table, action))
    case types.RECEIVE_ROUTERS:
      return state
      .withMutations((mutState) => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.RECEIVE_SINGLE_ROUTER:
    case types.RECEIVE_UPDATED_SINGLE_ROUTER:
      return state.withMutations((mutState) => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    default:
      return state
  }
}
