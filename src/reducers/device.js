import Immutable from 'immutable'

import types from './../constants/action_types'

function requestDevices(state, newState){
  return state.merge(newState)
}

function receiveDevices(state, devices){
  return state.merge({ loading: false, items: devices})
}

const device = function(state = Immutable.Map({
  loading: false,
  items: [],
  sortCol: 'name',
  sortDir: 'asc',
  page: 0,
  size: 2 }), action) {
  switch (action.type) {
  case types.REQUEST_DEVICES:
    return requestDevices(state, action)
  case types.RECEIVE_DEVICES:
    return receiveDevices(state, action.devices)
  }
  return state
}

export default device
