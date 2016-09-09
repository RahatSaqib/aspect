import Immutable from 'immutable'

import types from './../constants/action_types'
import {
  requestTable,
  receiveTableItems,
  Table
} from './meta/table'

function requestDevices(state, action) {
  return state
    .updateIn(['table'], table => requestTable(table, action))
}

function receiveDevices(state, items, total) {
  return state
    .updateIn(['table'], table => receiveTableItems(table, items, total))
}

const Device = Immutable.Record({
  table: new Table()
})

const initialState = new Device()

function device(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_DEVICES:
    return requestDevices(state, action)
  case types.RECEIVE_DEVICES:
    return receiveDevices(state, action.items, action.total)
  }
  return state
}

export default device
