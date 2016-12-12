import Immutable from 'immutable'

export const types = {
  SHOW_APP_NOTIFICATION: 'SHOW_APP_NOTIFICATION',
  SHOW_MORE_DETAILS: 'SHOW_MORE_DETAILS',
  HIDE_APP_NOTIFICATION: 'HIDE_APP_NOTIFICATION'
}
/*
 * ---------------- Action Creators -----------------
 */
function showNotification(options, messageValues, notificationType) {
  return {
    type: types.SHOW_APP_NOTIFICATION,
    notificationType,
    notificationOptions: {
      showAs: notificationType === 'acknowledgement' ? 'inline' : 'interrupt',
      showClose: true,
      showProceed: false,
      ...options
    },
    messageValues: { ...(messageValues || {}), ...options.messageValues }
  }
}

export function showError(options, messageValues) {
  return showNotification(options, messageValues, 'error')
}

export function showAcknowledgement(options, messageValues) {
  return showNotification(options, messageValues, 'acknowledgement')
}

export function showMoreDetails() {
  return {
    type: types.SHOW_MORE_DETAILS
  }
}

export function hideAppNotification() {
  return {
    type: types.HIDE_APP_NOTIFICATION
  }
}

/*
 * ---------------- Reducers -----------------
 */
const Error = Immutable.Record({
  hasNotification: false,
  notificationType: null,
  messageValues: {},
  showDetails: false,
  notificationOptions: null
})

const initialState = new Error()

export default function appNotificationReducer(state = initialState, action) {
  switch (action.type) {
    case types.SHOW_APP_NOTIFICATION:
      return state.merge({
        hasNotification: true,
        notificationType: action.notificationType,
        notificationOptions: action.notificationOptions,
        messageValues: action.messageValues || {},
        showDetails: action.notificationOptions.showAs === 'interrupt'
      })
    case types.SHOW_MORE_DETAILS:
      return state.set('showDetails', true)
    case types.HIDE_APP_NOTIFICATION:
      return state.merge({
        hasNotification: false,
        notificationType: null,
        showDetails: false,
        notificationOptions: null,
        messageValues: {}
      })
    default:
      return state
  }
}
