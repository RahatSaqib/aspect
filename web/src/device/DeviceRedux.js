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

// With state.filter.listFilter & extraFilters
export function fetchListFilteredDevices(extraFilters = {}, ...args) {
  return (dispatch, getState) => {
    const filters = getState()
      .filter
      .listFilter
      .toMap()
      .merge(extraFilters)
      .filter(_.identity)
      .toJS()

    return dispatch(fetchDevices(filters, ...args))
  }
}

export function fetchDevices(filters/* required */, sortCol = 'name', sortDir = 'asc', page = 0, pageSize = 10) {
  return (dispatch) => {
    dispatch(requestDevices(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(`/device?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters
    })}`,
      {
        errorNotifications: {
          400: filterFieldsRejectedError({
            id: 'errorResponseMessages.fetchDevices.GET.400.title',
            defaultMessage: 'Searching Devices Failed'
          }),
          default: errorPleaseTryAgainInAFewMinutes({
            id: 'errorResponseMessages.fetchDevices.GET.default.title',
            defaultMessage: 'Loading Devices Failed'
          })
        }
      })
      .then(json => dispatch(receiveDevices(json)))
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

export function fetchSingleDevice(deviceId) {
  return (dispatch) => {
    dispatch(requestSingleDevice(deviceId))

    return aspectFetch(`/device/${deviceId}`,
      {
        errorNotifications: {
          404: errorNotFound({
            id: 'errorResponseMessages.fetchSingleDevice.GET.404.title',
            defaultMessage: 'Could Not Find Device Details'
          }),
          default: errorPleaseTryAgainInAFewMinutes({
            id: 'errorResponseMessages.fetchSingleDevice.GET.default.title',
            defaultMessage: 'Error Loading Device Details'
          })
        }
      })
      .then(json => dispatch(receiveSingleDevice(json.data)))
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

export function updateSingleDevice(deviceId, data) {
  return (dispatch) => {
    dispatch(requestUpdatingSingleDevice(deviceId, data))

    return aspectFetch(`/device/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes({
          id: 'errorResponseMessages.updateSingleDevice.PUT.default.title',
          defaultMessage: 'An Error Occurred When Trying to Save the Device'
        })
      }
    }).then(json => dispatch(receiveUpdatedSingleDevice(json.data)))
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
