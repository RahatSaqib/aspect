import Immutable from 'immutable'
import types from './../constants/action_types'

const AccountDetailsData = Immutable.Record({
  id: undefined,
  userId: undefined,
  username: undefined,
  name: undefined,
  title: undefined,
  email: undefined,
  email2: undefined,
  phone: undefined,
  cell: undefined,
  countryId: undefined,
  stateId: undefined,
  lgaId: undefined,
  zip: undefined,
  timezone: undefined,
  culture: undefined
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
