import config from 'config'
import types from './../constants/action_types'
import util from './../util'
import { addError } from './error_creators'

function requestDevices(sortCol, sortDir) {
  return {
    type: types.REQUEST_DEVICES,
    sortCol,
    sortDir
  }
}

function receiveDevices(json) {
  return {
    type: types.RECEIVE_DEVICES,
    devices: json.data
  }
}

export function fetchDevices(sortCol, sortDir){
  return dispatch => {
    dispatch(requestDevices(sortCol, sortDir))

    let headers = new Headers({ 'x-access-token': window.localStorage.access })

    return fetch(config.aspectApi + '/device?sortCol=' + sortCol + '&sortDir=' + sortDir, { headers: headers })
      .then(util.handleFetchError)
      .then(json => dispatch(receiveDevices(json)))
      .catch(err => {
        dispatch(addError('Loading devices failed', err.message, err))
      })
  }
}
