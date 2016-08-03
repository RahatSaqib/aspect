import Immutable from 'immutable'
import config from 'config'

import util from './../util'
import { addError } from './error_creators'
import types from './../constants/action_types'

function requestPersons(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_PERSONS,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receivePersons(json) {
  return {
    type: types.RECEIVE_PERSONS,
    items: json.data,
    total: json.total
  }
}

export function fetchPersons(filters = Immutable.Map({ name: '' }), sortCol = 'name', sortDir = 'asc', page = 0, size = 10){
  return dispatch => {

    dispatch(requestPersons(sortCol, sortDir, page, size, filters))

    // filters is an immutable map. unwrap it:
    filters = filters.toJS()

    // serialize filters for querystring
    let qsFilters = ''
    if (filters){
      qsFilters = Object.keys(filters).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(filters[k])}`).join('&')
    }

    let headers = new Headers({ 'Authorization': 'Bearer ' + window.localStorage.jwt })

    return fetch(`${config.aspectApi}/person?sortCol=${sortCol}&sortDir=${sortDir}&page=${page}&size=${size}&${qsFilters}`, { headers: headers })
      .then(util.handleFetchError)
      .then(json => dispatch(receivePersons(json)))
      .catch(err => {
        dispatch(addError('Loading persons failed', err.message, err))
      })
  }
}
