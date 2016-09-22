import Immutable from 'immutable'
import types from './../constants/action_types'

function requestAccountDetails(state) {
  return state.set('loading', true)
}

function receiveAccountDetails(state, accountDetailsData) {
  return state.mergeDeep({
    loading: false,
    data: accountDetailsData
  })
}

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
  timezone: undefined,
  culture: undefined
})

const AccountDetails = Immutable.Record({
  loading: true,
  data: new AccountDetailsData()
})

const initialState = new AccountDetails()

function accountDetails(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_ACCOUNT_DETAILS:
    return requestAccountDetails(state)
  case types.RECEIVE_ACCOUNT_DETAILS:
    return receiveAccountDetails(state, action.accountDetails)
  }
  return state
}

export default accountDetails
