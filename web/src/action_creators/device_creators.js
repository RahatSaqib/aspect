import Immutable from 'immutable'
import { stringify } from 'querystring'

import { aspectFetch } from '../utils/fetch'
import { addError } from './error_creators'
import types from './../constants/action_types'

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

export function fetchDevices(filters = Immutable.Map({ name: '' }), sortCol = 'name', sortDir = 'asc', page = 0, pageSize = 10){
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
