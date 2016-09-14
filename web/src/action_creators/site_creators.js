import Immutable from 'immutable'

import { addError } from './error_creators'
import types from './../constants/action_types'

function requestSites(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_SITES,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receiveSites(json) {
  return {
    type: types.RECEIVE_SITES,
    items: json.data,
    total: json.total
  }
}

export function fetchSites(filters = Immutable.Map({ name: '' }), sortCol = 'name', sortDir = 'asc', page = 0, pageSize = 10){
  return dispatch => {

    dispatch(requestSites(sortCol, sortDir, page, pageSize, filters))

    // FIXME: return aspectFetch(`/site?${stringify({
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [{
            name: 'Y*&T^TFYU',
            lga: 'CA',
            numberOfDevices: 10
          }, {
            name: 'MKNJBHSAD@',
            lga: 'NY',
            numberOfDevices: 19
          }],
          length: 2,
          ok: true,
          total: 2
        })
      }, 500)
    })
      .then(json => dispatch(receiveSites(json)))
      .catch(err => {
        dispatch(addError('Loading sites failed', err.message, err))
      })
  }
}
