import Immutable from 'immutable'

import types from './../constants/action_types'
import {
  requestTable,
  receiveTableItems,
  Table
} from './meta/table'

function requestSites(state, action) {
  return state
    .updateIn(['table'], table => requestTable(table, action))
}

function receiveSites(state, items, total) {
  return state
    .updateIn(['table'], table => receiveTableItems(table, items, total))
}

const Site = Immutable.Record({
  table: new Table()
})

const initialState = new Site()

function site(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_SITES:
    return requestSites(state, action)
  case types.RECEIVE_SITES:
    return receiveSites(state, action.items, action.total)
  }
  return state
}

export default site
