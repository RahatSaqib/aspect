import Immutable from 'immutable'

export const types = {
  SHOW_ERROR_NOTIFICATION: 'SHOW_ERROR_NOTIFICATION',
  SHOW_MORE_DETAILS: 'SHOW_MORE_DETAILS',
  HIDE_ERROR_NOTIFICATION: 'HIDE_ERROR_NOTIFICATION',
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR'
}
/*
 * ---------------- Action Creators -----------------
 */
export function showErrorNotification(errorNotification, error) {
  return {
    type: types.SHOW_ERROR_NOTIFICATION,
    errorNotification: {
      showAs: 'interrupt',
      showClose: true,
      showProceed: false,
      ...errorNotification
    },
    error
  }
}

export function showMoreDetails() {
  return {
    type: types.SHOW_MORE_DETAILS
  }
}

export function hideErrorNotification() {
  return {
    type: types.HIDE_ERROR_NOTIFICATION
  }
}

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
  error: null,
  showDetails: false,
  errorNotification: null
})

const initialState = new Error()

export default function errorReducer(state = initialState, action) {
  switch (action.type) {
    case types.SHOW_ERROR_NOTIFICATION:
      return state.merge({
        errorNotification: action.errorNotification,
        error: action.error,
        showDetails: action.errorNotification.showAs === 'interrupt'
      })
    case types.SHOW_MORE_DETAILS:
      return state.set('showDetails', true)
    case types.HIDE_ERROR_NOTIFICATION:
      return state.merge({
        showDetails: false,
        errorNotification: null,
        error: null
      })
    case types.ADD_ERROR:
      return state.merge({
        hasError: true,
        title: action.title,
        message: action.message,
        error: action.error
      })
    case types.REMOVE_ERROR:
      return state.merge({
        hasError: false,
        title: null,
        message: null,
        error: null
      })
    default:
      return state
  }
}
