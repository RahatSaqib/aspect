import Immutable from 'immutable'

import types from './../constants/action_types'

function requestDevices(state, newState) {

  return state.merge({
    loading: true,
    sortCol: newState.sortCol,
    sortDir: newState.sortDir,
    page: newState.page,
    size: newState.size,
    filters: newState.filters
  })
}

function receiveDevices(state, items, total) {
  return state.merge({ loading: false, items, total })
}

const device = function(state = Immutable.Map({
  loading: false,
  items: Immutable.List(),
  sortCol: 'name',
  sortDir: 'asc',
  page: 0,
  size: 10,
  total: 0,
  filters: Immutable.Map({ name: '' })
}), action) {
  switch (action.type) {
  case types.REQUEST_DEVICES:
    return requestDevices(state, action)
  case types.RECEIVE_DEVICES:
    return receiveDevices(state, action.devices, action.total)
  }
  return state
}

export default device
