import Immutable from 'immutable'

import types from './../constants/action_types'

function requestDevices(state){
  return state.merge({ loading: true })
}

function receiveDevices(state, devices){
  return state.merge({ loading: false, items: devices})
}

const device = function(state = Immutable.Map({
  loading: false,
  items: []}), action) {
  switch (action.type) {
  case types.REQUEST_DEVICES:
    return requestDevices(state)
  case types.RECEIVE_DEVICES:
    return receiveDevices(state, action.devices)
  }
  return state
}

export default device
