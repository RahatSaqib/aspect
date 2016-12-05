import Immutable from 'immutable'

export const types = {
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR'
}
/*
 * ---------------- Action Creators -----------------
 */
export function addError(title, message, error) {
  return {
    type: types.ADD_ERROR,
    title,
    message,
    error
  }
}

export function removeError() {
  return {
    type: types.REMOVE_ERROR
  }
}
/*
 * ---------------- Reducers -----------------
 */
// this is a very simple error store right now.
// it will only ever hold one error
// could be easily extended to hold history of errors, dismissible, etc.
// message is a string, error is a js object that can have any shape
const Error = Immutable.Record({
  hasError: false,
  title: null,
  message: null,
  error: null
})

const initialState = new Error()

export default function errorReducer(state = initialState, action) {
  switch (action.type) {
    case types.ADD_ERROR:
      return state.merge({
        hasError: true,
        title: action.title,
        message: action.message,
        error: action.error
      })
    case types.REMOVE_ERROR:
      return state.clear()
    default:
      return state
  }
}
