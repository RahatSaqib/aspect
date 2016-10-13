import Immutable from 'immutable'
import { aspectFetch, getHeaders } from '../shared/utils/fetch'
import { addError } from '../error/ErrorRedux'

export const types = {
  REQUEST_ACCOUNT_DETAILS: 'REQUEST_ACCOUNT_DETAILS',
  RECEIVE_ACCOUNT_DETAILS: 'RECEIVE_ACCOUNT_DETAILS',
  SAVE_ACCOUNT_DETAILS_START: 'SAVE_ACCOUNT_DETAILS_START'
}

/*
 * ---------------- Action Creators -----------------
 */
function createRequestAccountDetails() {
  return {
    type: types.REQUEST_ACCOUNT_DETAILS
  }
}

function createReceiveAccountDetails(accountDetails) {
  return {
    type: types.RECEIVE_ACCOUNT_DETAILS,
    accountDetails
  }
}

export function fetchAccountDetails(){
  return dispatch => {
    dispatch(createRequestAccountDetails())
    return aspectFetch('/account-details/current')
      .then(json => dispatch(createReceiveAccountDetails(json.data)))
                                      //TODO: i18n these error messages
      .catch(err => dispatch(addError('Loading account details failed', err.message, err)))
  }
}

function createSaveAccountDetailsStart() {
  return {
    type: types.SAVE_ACCOUNT_DETAILS_START
  }
}

export function saveAccountDetails(accountDetails) {
  return dispatch => {
    dispatch(createSaveAccountDetailsStart())
    return aspectFetch('/account-details/current',
      {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(accountDetails)
      })
      .then(json => dispatch(createReceiveAccountDetails(json.data)))
      .catch(err => dispatch(addError('Loading account details failed', err.message, err)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const AccountDetailsData = Immutable.Record({
  id: null,
  userId: null,
  username: null,
  name: null,
  title: null,
  email: null,
  email2: null,
  phone: null,
  cell: null,
  countryId: null,
  stateId: null,
  lgaId: null,
  zip: null,
  timezone: null,
  culture: null
})

const AccountDetails = Immutable.Record({
  loading: false,
  saving: false,
  data: new AccountDetailsData()
})

const initialState = new AccountDetails()

function requestAccountDetails(state) {
  return state.merge({
    loading: true
  })
}

function receiveAccountDetails(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    saving: false,
    data: accountDetailsData
  })
}

function saveAccountDetailsStart(state) {
  return state.merge({
    saving: true
  })
}

export default function accountDetailsReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_ACCOUNT_DETAILS:
    return requestAccountDetails(state)
  case types.RECEIVE_ACCOUNT_DETAILS:
    return receiveAccountDetails(state, action.accountDetails)
  case types.SAVE_ACCOUNT_DETAILS_START:
    return saveAccountDetailsStart(state)
  }
  return state
}
