import Immutable from 'immutable'
import types from './../constants/action_types'

function receiveCurrentlyLoggedInAccountDetails(state, accountDetails) {
  return state.merge(accountDetails)
}

const AccountDetails = Immutable.Record({
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
  timezone: null,
  culture: null
})

const initialState = new AccountDetails()

function accountDetails(state = initialState, action) {
  switch (action.type) {
  case types.RECEIVE_CURRENTLY_LOGGED_ACCOUNT_DETAILS:
    return receiveCurrentlyLoggedInAccountDetails(state, action.accountDetails)
  }
  return state
}

export default accountDetails
