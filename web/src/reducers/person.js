import Immutable from 'immutable'

import types from './../constants/action_types'
import {
  receiveList,
  Items
} from './meta/items'
import {
  requestTable,
  receiveTableItems,
  Table
} from './meta/table'

function requestPersons(state, action) {
  return state
    .set('table', requestTable(state.table, action))
}

function receivePersons(state, list, total) {
  return state.withMutations(mutState => {
    const immutList = Immutable.fromJS(list)
    mutState.set('items', receiveList(mutState.items, immutList))
    mutState.set('table', receiveTableItems(mutState.table, total))
  })
}

const Person = Immutable.Record({
  items: new Items(),
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
