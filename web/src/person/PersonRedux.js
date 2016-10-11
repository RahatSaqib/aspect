import Immutable from 'immutable'
import { stringify } from 'querystring'

import { aspectFetch } from '../utils/fetch'
import { addError } from '../error/ErrorRedux'
import {
  receiveList,
  Items
} from '../reducers/meta/items'
import {
  requestTable,
  receiveTableItems,
  Table
} from '../reducers/meta/table'

export const types = {
  REQUEST_PERSONS: 'REQUEST_PERSONS',
  RECEIVE_PERSONS: 'RECEIVE_PERSONS'
}

/*
 * ---------------- Action Creators -----------------
 */
function requestPersons(sortCol, sortDir, page, size, filters) {
  return {
    type: types.REQUEST_PERSONS,
    sortCol,
    sortDir,
    page,
    size,
    filters
  }
}

function receivePersons(json) {
  return {
    type: types.RECEIVE_PERSONS,
    items: json.data,
    total: json.total
  }
}

export function fetchPersons(filters = Immutable.Map({ name: '' }), sortCol = 'name', sortDir = 'asc', page = 0, pageSize = 10){
  return dispatch => {

    dispatch(requestPersons(sortCol, sortDir, page, pageSize, filters))

    return aspectFetch(`/person?${stringify({
      sortCol,
      sortDir,
      page,
      size: pageSize,
      ...filters.toJS()
    })}`)
      .then(json => dispatch(receivePersons(json)))
      .catch(err => {
        dispatch(addError('Loading persons failed', err.message, err))
      })
  }
}
/*
 * ---------------- Reducers -----------------
 */
const Person = Immutable.Record({
  items: new Items(),
  table: new Table()
})

const initialState = new Person()

export default function personReducer(state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_PERSONS:
    return state
      .set('table', requestTable(state.table, action))
  case types.RECEIVE_PERSONS:
    return state.withMutations(mutState => {
      const immutList = Immutable.fromJS(action.items)
      mutState.set('items', receiveList(mutState.items, immutList))
      mutState.set('table', receiveTableItems(mutState.table, action.total))
    })
  }
  return state
}
