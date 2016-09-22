import Immutable from 'immutable'

import types from './../constants/action_types'
import {
  receiveList,
  receiveItem,
  Items
} from './meta/items'
import {
  requestTable,
  receiveTableItems,
  Table
} from './meta/table'

function requestDevices(state, action) {
  return state
    .set('table', requestTable(state.table, action))
}

function receiveDevices(state, list, total) {
  return state.withMutations(mutState => {
    const immutList = Immutable.fromJS(list)
    mutState.set('items', receiveList(mutState.items, immutList))
    mutState.set('table', receiveTableItems(mutState.table, total))
  })
}

function receiveADevice(state, item) {
  return state.withMutations(mutState => {
    const immutItem = Immutable.fromJS(item)
    mutState.set('items', receiveItem(mutState.items, immutItem))
  })
}

const Device = Immutable.Record({
  items: new Items(),
  table: new Table()
})

const initialState = new Device()

function device(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_DEVICES:
    return requestDevices(state, action)
  case types.RECEIVE_DEVICES:
    return receiveDevices(state, action.items, action.total)
  case types.RECEIVE_A_DEVICE:
    return receiveADevice(state, action.item)
  case types.RECEIVE_UPDATED_SINGLE_DEVICE:
    return receiveADevice(state, action.item)
  }
  return state
}

export default device
