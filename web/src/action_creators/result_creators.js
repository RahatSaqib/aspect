import Immutable from 'immutable'
import { stringify } from 'querystring'

import { aspectFetch } from '../utils/fetch'
import { addError } from './error_creators'
import types from './../constants/action_types'

function requestResults(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_RESULTS,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receiveResults(json) {
  return {
    type: types.RECEIVE_RESULTS,
    items: json.data,
    total: json.total
  }
}

export function fetchResults(filters = Immutable.Map({ deviceName: '' }), sortCol = 'deviceName', sortDir = 'asc', page = 0, pageSize = 10){
  return dispatch => {

    dispatch(requestResults(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(`/result?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters.toJS()
    })}`)
      .then(json => dispatch(receiveResults(json)))
      .catch(err => {
        dispatch(addError('Loading results failed', err.message, err))
      })
  }
}
