import Immutable from 'immutable'

import types from './../constants/action_types'
import {
  requestTable,
  receiveTableItems,
  Table
} from './meta/table'

function requestPersons(state, action) {
  return state
    .updateIn(['table'], table => requestTable(table, action))
}

function receivePersons(state, items, total) {
  return state
    .updateIn(['table'], table => receiveTableItems(table, items, total))
}

const Person = Immutable.Record({
  table: new Table()
})

const initialState = new Person()

function person(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_PERSONS:
    return requestPersons(state, action)
  case types.RECEIVE_PERSONS:
    return receivePersons(state, action.items, action.total)
  }
  return state
}

export default person
