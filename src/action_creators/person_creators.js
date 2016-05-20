import config from 'config'
import types from './../constants/action_types'
import util from './../util'
import { addError } from './error_creators'

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
    persons: json.data,
    total: json.total
  }
}

export function resetPersons(){
  return fetchPersons('name', 'asc', 0, 10, { name: '' })
}

export function filterPersons(filters){
  return fetchPersons('name', 'asc', 0, 10, filters)
}

export function fetchPersons(sortCol, sortDir, page, size, filters){
  return dispatch => {

    dispatch(requestPersons(sortCol, sortDir, page, size, filters))

    // filters might be an immutable map. unwrap it:
    let qsFilters = ''
    if (filters && filters.toObject){
      filters = filters.toObject()
    }

    // serialize filters for querystring
    if (filters){
      qsFilters = Object.keys(filters).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(filters[k])}`).join('&')
    }

    let headers = new Headers({ 'x-access-token': window.localStorage.access })

    return fetch(`${config.aspectApi}/person?sortCol=${sortCol}&sortDir=${sortDir}&page=${page}&size=${size}&${qsFilters}`, { headers: headers })
      .then(util.handleFetchError)
      .then(json => dispatch(receivePersons(json)))
      .catch(err => {
        dispatch(addError('Loading persons failed', err.message, err))
      })
  }
}
