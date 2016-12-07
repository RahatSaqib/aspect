import Immutable from 'immutable'

export const types = {
  SHOW_ERROR_NOTIFICATION: 'SHOW_ERROR_NOTIFICATION',
  SHOW_MORE_DETAILS: 'SHOW_MORE_DETAILS',
  HIDE_ERROR_NOTIFICATION: 'HIDE_ERROR_NOTIFICATION'
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
    error: error || {}
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

/*
 * ---------------- Reducers -----------------
 */
// this is a very simple error store right now.
// it will only ever hold one error
// could be easily extended to hold history of errors, dismissible, etc.
// message is a string, error is a js object that can have any shape
const Error = Immutable.Record({
  hasError: false,
  error: null,
  showDetails: false,
  errorNotification: null
})

const initialState = new Error()

export default function errorReducer(state = initialState, action) {
  switch (action.type) {
    case types.SHOW_ERROR_NOTIFICATION:
      return state.merge({
        hasError: true,
        errorNotification: action.errorNotification,
        error: action.error,
        showDetails: action.errorNotification.showAs === 'interrupt'
      })
    case types.SHOW_MORE_DETAILS:
      return state.set('showDetails', true)
    case types.HIDE_ERROR_NOTIFICATION:
      return state.merge({
        hasError: false,
        showDetails: false,
        errorNotification: null,
        error: null
      })
    default:
      return state
  }
}
