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

function requestSites(state, action) {
  return state
    .set('table', requestTable(state.table, action))
}

function receiveSites(state, list, total) {
  return state.withMutations(mutState => {
    const immutList = Immutable.fromJS(list)
    mutState.set('items', receiveList(mutState.items, immutList))
    mutState.set('table', receiveTableItems(mutState.table, total))
  })
}

function receiveSingleSite(state, item) {
  return state.withMutations(mutState => {
    const immutItem = Immutable.fromJS(item)
    mutState.set('items', receiveItem(mutState.items, immutItem))
  })
}

const Site = Immutable.Record({
  items: new Items(),
  table: new Table()
})

const initialState = new Site()

function site(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_SITES:
    return requestSites(state, action)
  case types.RECEIVE_SITES:
    return receiveSites(state, action.items, action.total)
  case types.RECEIVE_SINGLE_SITE:
    return receiveSingleSite(state, action.item)
  case types.RECEIVE_UPDATED_SINGLE_SITE:
    return receiveSingleSite(state, action.item)
  }
  return state
}

export default site
