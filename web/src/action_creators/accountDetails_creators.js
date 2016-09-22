import {aspectFetch } from '../utils/fetch'
import { addError } from './error_creators'
import types from './../constants/action_types'

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
      .then(json => dispatch(receiveAccountDetails(json.data)))
      .catch(err => {
        //TODO: i18n
        dispatch(addError('Loading account details failed', err.message, err))
      })
  }
}
