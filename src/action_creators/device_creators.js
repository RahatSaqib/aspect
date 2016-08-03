import Immutable from 'immutable'
import config from 'config'

import util from './../util'
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

export function fetchDevices(filters = Immutable.Map({ name: '' }), sortCol = 'name', sortDir = 'asc', page = 0, size = 10){
  return dispatch => {

    dispatch(requestDevices(sortCol, sortDir, page, size, filters))

    // filters is an immutable map. unwrap it:
    filters = filters.toJS()

    // serialize filters for querystring
    let qsFilters = ''
    if (filters){
      qsFilters = Object.keys(filters).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(filters[k])}`).join('&')
    }

    let headers = new Headers({ 'Authorization': 'Bearer ' + window.localStorage.jwt })

    return fetch(`${config.aspectApi}/device?sortCol=${sortCol}&sortDir=${sortDir}&page=${page}&size=${size}&${qsFilters}`, { headers: headers })
      .then(util.handleFetchError)
      .then(json => dispatch(receiveDevices(json)))
      .catch(err => {
        dispatch(addError('Loading devices failed', err.message, err))
      })
  }
}
