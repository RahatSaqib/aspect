import {aspectFetch } from '../utils/fetch'
import { addError } from './error_creators'
import types from './../constants/action_types'

function requestCurrentlyLoggedInAccountDetails() {
  return {
    type: types.REQUEST_CURRENTLY_LOGGED_ACCOUNT_DETAILS
  }
}

function receiveCurrentlyLoggedInAccountDetails(accountDetails) {
  return {
    type: types.RECEIVE_CURRENTLY_LOGGED_ACCOUNT_DETAILS,
    accountDetails
  }
}

export function fetchCurrentlyLoggedAccountDetails(){
  return dispatch => {
    dispatch(requestCurrentlyLoggedInAccountDetails())
    return aspectFetch('/account-details/current')
      .then(json => dispatch(receiveCurrentlyLoggedInAccountDetails(json.data)))
      .catch(err => {
        dispatch(addError('Loading account details failed', err.message, err))
      })
  }
}
