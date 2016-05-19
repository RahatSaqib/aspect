import Immutable from 'immutable'

import types from './../constants/action_types'

function requestDevices(state, sortCol, sortDir){
  return state.merge({ loading: true, sortCol: sortCol, sortDir: sortDir })
}

function receiveDevices(state, devices){
  return state.merge({ loading: false, items: devices})
}

const device = function(state = Immutable.Map({
  loading: false,
  items: [],
  sortCol: 'name',
  sortDir: 'asc'}), action) {
  switch (action.type) {
  case types.REQUEST_DEVICES:
    return requestDevices(state, action.sortCol, action.sortDir)
  case types.RECEIVE_DEVICES:
    return receiveDevices(state, action.devices)
  }
  return state
}

export default device
