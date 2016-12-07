import _ from 'lodash'
import Immutable from 'immutable'
import { stringify } from 'querystring'

import { aspectFetch } from '../shared/utils/fetch'
import {
  filterFieldsRejectedError,
  errorNotFound,
  errorPleaseTryAgainInAFewMinutes
} from '../error/CommonErrorNotifications'

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
    })}`, {
      errorNotifications: {
        400: filterFieldsRejectedError({
          id: 'errorResponseMessages.fetchRouters.GET.400.title',
          defaultMessage: 'Searching Routers Failed'
        }),
        default: errorPleaseTryAgainInAFewMinutes({
          id: 'errorResponseMessages.fetchRouters.GET.default.title',
          defaultMessage: 'Loading Routers Failed'
        })
      }
    }).then(json => dispatch(receiveRouters(json)))
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

    return aspectFetch(`/device/${routerId}`, {
      errorNotifications: {
        404: errorNotFound({
          id: 'errorResponseMessages.fetchSingleRouter.GET.404.title',
          defaultMessage: 'Could Not Find Router Details'
        }),
        default: errorPleaseTryAgainInAFewMinutes({
          id: 'errorResponseMessages.fetchSingleRouter.GET.default.title',
          defaultMessage: 'Error Loading Router Details'
        })
      }
    }).then(json => dispatch(receiveSingleRouter(json.data)))
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
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          id: 'errorResponseMessages.updateSingleRouter.PUT.default.title',
          defaultMessage: 'An Error Occurred When Trying to Save the Router'
        })
      }
    }).then(json => dispatch(receiveUpdatedSingleRouter(json.data)))
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
