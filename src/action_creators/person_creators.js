import config from 'config'
import types from './../constants/action_types'
import util from './../util'
import { addError } from './error_creators'

function requestPersons(sortCol, sortDir, page, size) {
  return {
    type: types.REQUEST_PERSONS,
    sortCol,
    sortDir,
    page,
    size
  }
}

function receivePersons(json) {
  return {
    type: types.RECEIVE_PERSONS,
    persons: json.data,
    total: json.total
  }
}

export function fetchPersons(sortCol, sortDir, page, size){
  return dispatch => {
    dispatch(requestPersons(sortCol, sortDir, page, size))

    let headers = new Headers({ 'x-access-token': window.localStorage.access })

    return fetch(`${config.aspectApi}/person?sortCol=${sortCol}&sortDir=${sortDir}&page=${page}&size=${size}`, { headers: headers })
      .then(util.handleFetchError)
      .then(json => dispatch(receivePersons(json)))
      .catch(err => {
        dispatch(addError('Loading persons failed', err.message, err))
      })
  }
}
