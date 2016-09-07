import Immutable from 'immutable'

import types from './../constants/action_types'

// this is a very simple error store right now.
// it will only ever hold one error
// could be easily extended to hold history of errors, dismissable, etc.
// desc is a string, details in a js object that can have any shape
function addError(state, newState){
  return state.merge({
    hasError: true,
    ...newState // FIXME: require explicit keys
  })
}

function removeError(state){
  return state.clear()
}

const Error = Immutable.Record({
  hasError: false,
  title: null,
  desc: null,
  obj: null
})

const initialState = new Error()

function error(state = initialState, action) {
  switch (action.type) {
  case types.ADD_ERROR:
    return addError(state, action.error)
  case types.REMOVE_ERROR:
    return removeError(state)
  }
  return state
}

export default error
