import types from './../constants/action_types'

const initialState = {
  loading: false,
  data: {
    username: '',
    name: ''
  }
}

function requestAccountDetails(state) {
  return {...state,
    loading: true
  }
}

function receiveAccountDetails(state, accountDetailsData) {
  return {...state,
    loading: false,
    data: accountDetailsData
  }
}

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
