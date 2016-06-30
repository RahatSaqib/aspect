import config from 'config'
import types from './../constants/action_types'
import util from './../util'
import { addError } from './error_creators'
import Immutable from 'immutable'

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
    devices: json.data,
    total: json.total
  }
}

export function resetDevices(){
  return fetchDevices('name', 'asc', 0, 10, Immutable.Map({ name: '' }))
}

export function filterDevices(filters){
  return fetchDevices('name', 'asc', 0, 10, filters)
}

export function fetchDevices(sortCol, sortDir, page, size, filters){
  return dispatch => {

    dispatch(requestDevices(sortCol, sortDir, page, size, filters))

    // filters is an immutable map. unwrap it:
    filters = filters.toObject()

    // serialize filters for querystring
    let qsFilters = ''
    if (filters){
      qsFilters = Object.keys(filters).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(filters[k])}`).join('&')
    }

    let headers = new Headers({ 'x-access-token': window.localStorage.access })

    return fetch(`${config.aspectApi}/device?sortCol=${sortCol}&sortDir=${sortDir}&page=${page}&size=${size}&${qsFilters}`, { headers: headers })
      .then(util.handleFetchError)
      .then(json => dispatch(receiveDevices(json)))
      .catch(err => {
        dispatch(addError('Loading devices failed', err.message, err))
      })
  }
}
