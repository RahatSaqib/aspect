import {aspectFetch } from '../utils/fetch'
import { addError } from './error_creators'
import types from './../constants/action_types'
import * as fetchUtils from '../utils/fetch'

function requestAccountDetails() {
  return {
    type: types.REQUEST_ACCOUNT_DETAILS
  }
}

function receiveAccountDetails(accountDetails) {
  return {
    type: types.RECEIVE_ACCOUNT_DETAILS,
    accountDetails
  }
}

export function fetchAccountDetails(){
  return dispatch => {
    dispatch(requestAccountDetails())
    return aspectFetch('/account-details/current')
      .then(fetchUtils.handleFetchError)
      .then(json => dispatch(receiveAccountDetails(json.data)))
      .catch(err => {
        //TODO: i18n
        dispatch(addError('Loading account details failed', err.message, err))
      })
  }
}

function saveAccountDetailsStart() {
  return {
    type: types.SAVE_ACCOUNT_DETAILS_START
  }
}

export function saveAccountDetails(accountDetails) {
  return dispatch => {
    dispatch(saveAccountDetailsStart())
    return aspectFetch('/account-details/current',
      {
        method: 'PUT',
        headers: fetchUtils.getHeaders(true),
        body: JSON.stringify(accountDetails)
      })
      .then(fetchUtils.handleFetchError)
      .then(json => dispatch(receiveAccountDetails(json.data)))
      .catch(err => {
        //TODO: i18n
        dispatch(addError('Loading account details failed', err.message, err))
      })
  }
}
