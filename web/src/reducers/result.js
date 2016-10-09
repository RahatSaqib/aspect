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

function requestResults(state, action) {
  return state
    .set('table', requestTable(state.table, action))
}

function receiveResults(state, list, total) {
  return state.withMutations(mutState => {
    const immutList = Immutable.fromJS(list)
    mutState.set('items', receiveList(mutState.items, immutList))
    mutState.set('table', receiveTableItems(mutState.table, total))
  })
}

const Result = Immutable.Record({
  items: new Items(),
  table: new Table({
    sortCol: 'deviceName',
    filters: Immutable.fromJS({ deviceName: '' })
  })
})

const initialState = new Result()

function result(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_RESULTS:
    return requestResults(state, action)
  case types.RECEIVE_RESULTS:
    return receiveResults(state, action.items, action.total)
  }
  return state
}

export default result
