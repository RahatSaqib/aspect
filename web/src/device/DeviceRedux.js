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
function requestDevices(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_DEVICES,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receiveDevices(json) {
  return {
    type: types.RECEIVE_DEVICES,
    items: json.data,
    total: json.total
  }
}

export function fetchDevices(filters/* required */, sortCol = 'name', sortDir = 'asc', page = 0, pageSize = 10){
  return dispatch => {

    dispatch(requestDevices(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(`/device?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters.toJS()
    })}`)
      .then(json => dispatch(receiveDevices(json)))
      .catch(err => {
        dispatch(addError('Loading devices failed', err.message, err))
      })
  }
}

function requestSingleDevice(deviceId) {
  return {
    type: types.REQUEST_SINGLE_DEVICE,
    deviceId
  }
}

function receiveSingleDevice(item) {
  return {
    type: types.RECEIVE_SINGLE_DEVICE,
    item
  }
}

export function fetchSingleDevice(deviceId){
  return dispatch => {

    dispatch(requestSingleDevice(deviceId))

    return aspectFetch(`/device/${deviceId}`)
      .then(json => dispatch(receiveSingleDevice(json.data)))
      .catch(err => {
        dispatch(addError(`Loading a device (${deviceId}) failed`, err.message, err))
      })
  }
}

function requestUpdatingSingleDevice(deviceId, data) {
  return {
    type: types.REQUEST_UPDATING_SINGLE_DEVICE,
    deviceId,
    data
  }
}

function receiveUpdatedSingleDevice(item) {
  return {
    type: types.RECEIVE_UPDATED_SINGLE_DEVICE,
    item
  }
}

export function updateSingleDevice(deviceId, data){
  return dispatch => {

    dispatch(requestUpdatingSingleDevice(deviceId, data))

    return aspectFetch(`/device/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
      .then(json => dispatch(receiveUpdatedSingleDevice(json.data)))
      .catch(err => {
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
      .withMutations(mutState => {
        const immutList = Immutable.fromJS(action.items)
        mutState.set('items', receiveList(mutState.items, immutList))
        mutState.set('table', receiveTableItems(mutState.table, action.total))
      })
  case types.RECEIVE_SINGLE_DEVICE:
  case types.RECEIVE_UPDATED_SINGLE_DEVICE:
    return state
      .withMutations(mutState => {
        const immutItem = Immutable.fromJS(action.item)
        mutState.set('items', receiveItem(mutState.items, immutItem))
      })
  }
  return state
}
