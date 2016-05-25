import Immutable from 'immutable'

import types from './../constants/action_types'

function requestPersons(state, newState) {

  return state.merge({
    loading: true,
    sortCol: newState.sortCol,
    sortDir: newState.sortDir,
    page: newState.page,
    size: newState.size,
    filters: newState.filters
  })
}

function receivePersons(state, persons, total) {
  return state.merge({ loading: false, items: persons, total: total })
}

const person = function(state = Immutable.Map({
  loading: false,
  items: Immutable.List(),
  sortCol: 'name',
  sortDir: 'asc',
  page: 0,
  size: 10,
  total: 0,
  filters: Immutable.Map({ name: '' })
}), action) {
  switch (action.type) {
  case types.REQUEST_PERSONS:
    return requestPersons(state, action)
  case types.RECEIVE_PERSONS:
    return receivePersons(state, action.persons, action.total)
  }
  return state
}

export default person
