import Immutable from 'immutable'

import types from './../constants/action_types'

function requestPersons(state, newState) {
  return state.merge({
    loading: true,
    ...newState
  })
}

function receivePersons(state, items, total) {
  return state.merge({ loading: false, items, total })
}

const initialState = Immutable.fromJS({
  loading: false,
  items: [],
  sortCol: 'name',
  sortDir: 'asc',
  page: 0,
  size: 10,
  total: 0,
  filters: { name: '' }
})

const person = function (state = initialState, action) {
  switch (action.type) {
  case types.REQUEST_PERSONS:
    return requestPersons(state, action)
  case types.RECEIVE_PERSONS:
    return receivePersons(state, action.items, action.total)
  }
  return state
}

export default person
