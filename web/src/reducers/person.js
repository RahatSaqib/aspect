import Immutable from 'immutable'

import types from './../constants/action_types'

function requestPersons(state, action) {
  return state.merge({
    loading: true,
    sortCol: action.sortCol,
    sortDir: action.sortDir,
    page: action.page,
    pageSize: action.size,
    filters: action.filters
  })
}

function receivePersons(state, items, total) {
  return state.merge({ loading: false, items, total })
}

const Person = Immutable.Record({
  loading: false,
  items: Immutable.List(),
  sortCol: 'name',
  sortDir: 'asc',
  page: 0,
  pageSize: 10, // Renamed from 'size' since 'size' will conflict with Immutable internal property
  total: 0,
  filters: Immutable.fromJS({ name: '' })
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
