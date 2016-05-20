import Immutable from 'immutable'

import types from './../constants/action_types'

function requestDevices(state, newState){
  return state.merge(newState)
}

function receiveDevices(state, devices, total){
  return state.merge({ loading: false, items: devices, total: total})
}

const device = function(state = Immutable.Map({
  loading: false,
  items: [],
  sortCol: 'name',
  sortDir: 'asc',
  page: 0,
  size: 10,
  total: 0 }), action) {
  switch (action.type) {
  case types.REQUEST_DEVICES:
    return requestDevices(state, action)
  case types.RECEIVE_DEVICES:
    return receiveDevices(state, action.devices, action.total)
  }
  return state
}

export default device
