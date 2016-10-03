import Immutable from 'immutable'
import types from './../constants/action_types'

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

function accountDetails(state = initialState, action) {
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

export default accountDetails
