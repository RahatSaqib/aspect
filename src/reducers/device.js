import Immutable from 'immutable'

import types from './../constants/action_types'

function requestDevices(state, newState) {
  return state.merge({
    loading: true,
    ...newState
  })
}

function receiveDevices(state, items, total) {
  return state.merge({ loading: false, items, total })
}

const initialState = Immutable.fromJS({
  loading: false,
  items: [],
  sortCol: 'name',
  sortDir: 'asc',
  page: 0,
  size: 10,
  total: 0,
  filters: { name: '' }
})

const device = function(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_DEVICES:
    return requestDevices(state, action)
  case types.RECEIVE_DEVICES:
    return receiveDevices(state, action.items, action.total)
  }
  return state
}

export default device
