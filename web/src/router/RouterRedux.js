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
  REQUEST_DEVICES: 'REQUEST_DEVICES',
  RECEIVE_DEVICES: 'RECEIVE_DEVICES',

  REQUEST_SINGLE_DEVICE: 'REQUEST_SINGLE_DEVICE',
  RECEIVE_SINGLE_DEVICE: 'RECEIVE_SINGLE_DEVICE',

  REQUEST_UPDATING_SINGLE_DEVICE: 'REQUEST_UPDATING_SINGLE_DEVICE',
  RECEIVE_UPDATED_SINGLE_DEVICE: 'RECEIVE_UPDATED_SINGLE_DEVICE'
}
/*
 * ---------------- Action Creators -----------------
 */
function requestRouters(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_DEVICES,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receiveRouters(json) {
  return {
    type: types.RECEIVE_DEVICES,
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
        dispatch(addError('Loading devices failed', err.message, err))
      })
  }
}

function requestSingleRouter(deviceId) {
  return {
    type: types.REQUEST_SINGLE_DEVICE,
    deviceId
  }
}

function receiveSingleRouter(item) {
  return {
    type: types.RECEIVE_SINGLE_DEVICE,
    item
  }
}

export function fetchSingleRouter(deviceId) {
  return (dispatch) => {
    dispatch(requestSingleRouter(deviceId))

    return aspectFetch(`/device/${deviceId}`)
      .then(json => dispatch(receiveSingleRouter(json.data)))
      .catch((err) => {
        dispatch(addError(`Loading a device (${deviceId}) failed`, err.message, err))
      })
  }
}

function requestUpdatingSingleRouter(deviceId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_DEVICE,
    deviceId,
    data
  }
}

function receiveUpdatedSingleRouter(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_DEVICE,
    item
  }
}

export function updateSingleRouter(deviceId, data) {
  return (dispatch) => {
    dispatch(requestUpdatingSingleRouter(deviceId, data))

    return aspectFetch(`/device/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
      .then(json => dispatch(receiveUpdatedSingleRouter(json.data)))
      .catch((err) => {
        dispatch(addError(`Updating a device (${deviceId}) failed`, err.message, err))
      })
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Device = Immutable.Record({
  items: new Items(),
  table: new Table()
})

const initialState = new Device()

export default function deviceReducer(state = initialState, action) {
  switch (action.type) {
    case types.REQUEST_DEVICES:
      return state
      .set('table', requestTable(state.table, action))
    case types.RECEIVE_DEVICES:
      return state
      .withMutations((mutState) => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
    case types.RECEIVE_SINGLE_DEVICE:
    case types.RECEIVE_UPDATED_SINGLE_DEVICE:
      return state.withMutations((mutState) => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
    default:
      return state
  }
}
