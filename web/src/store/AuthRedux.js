import Immutable from 'immutable'
import jwtDecode from 'jwt-decode'
import forEach from 'lodash/forEach'
import isNil from 'lodash/isNil'
import pick from 'lodash/pick'
import { defineMessages } from 'react-intl'
import { SubmissionError } from 'redux-form/immutable'
import config from '../config'
import { reasonTypes } from '../pages/Auth/loggedOutReasons'
import {
  errorPleaseTryAgainInAFewMinutes,
  inlineErrorPleaseTryAgainInAFewMinutes,
} from '../utils/error/CommonErrorNotifications'
import { getClientId, getClientName } from '../utils/utils/browser'
import { aspectFetch } from '../utils/utils/fetch'
import { hideServiceDegradation, showServiceDegradation } from './ServiceDegradation'

const previousCulture = localStorage.getItem('asCulture')
const currentCulture = config.defaultCulture

export const types = {
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',

  REFRESH_SUCCESS: 'REFRESH_SUCCESS',
  REFRESH_FAILURE: 'REFRESH_FAILURE',

  LOGOUT: 'LOGOUT',

  RESET_PASSWORD_ENTER_PASSWORD_SUCCESS: 'RESET_PASSWORD_ENTER_PASSWORD_SUCCESS',

  REQUEST_LICENSE: 'REQUEST_LICENSE',
  RECEIVE_LICENSE: 'RECEIVE_LICENSE',

  ACCEPT_LICENSE_REQUEST: 'ACCEPT_LICENSE_REQUEST',
  ACCEPT_LICENSE_SUCCESS: 'ACCEPT_LICENSE_SUCCESS',
  ACCEPT_LICENSE_FAILURE: 'ACCEPT_LICENSE_FAILURE',
}

/*
 * ---------------- Action Creators -----------------
 */

function loginRequest(requestedAt) {
  return {
    type: types.LOGIN_REQUEST,
    requestedAt,
  }
}

function loginSuccess(requestedAt, data) {
  return {
    requestedAt,
    type: types.LOGIN_SUCCESS,
    data,
  }
}

function loginFailure(err) {
  return {
    type: types.LOGIN_FAILURE,
    err,
  }
}

export function loginStart({ user, password }) {
  return function (dispatch) {
    // First dispatch: the app state is updated to inform
    // that the API call is starting.
    const requestedAt = Date.now()
    dispatch(loginRequest(requestedAt))
    dispatch(hideServiceDegradation())
    const clientId = localStorage.getItem('asClientId') || getClientId()
    return aspectFetch('/auth', {
      method: 'POST',
      body: JSON.stringify({
        name: user,
        password,
        clientId,
        clientType: 'web',
        clientName: getClientName(),
      }),
      errorNotifications: {
        401: {
          'Authentication failed. Wrong username or password.': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.401.authenticationFailed.title',
                defaultMessage: 'Login Failed',
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.401.authenticationFailed.message',
                defaultMessage: 'Incorrect username or password',
              },
              resolution: {
                id: 'errorResponseMessages.loginStart.POST.401.authenticationFailed.resolution',
                defaultMessage: 'Please, correct the credentials your entered and try again.',
              },
            }),
          },
          'Incorrect password': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.401.incorrectPassword.title',
                defaultMessage: 'Could not update your credentials',
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.401.incorrectPassword.message',
                defaultMessage: 'The password you entered is incorrect',
              },
              resolution: {
                id: 'errorResponseMessages.loginStart.POST.401.incorrectPassword.resolution',
                defaultMessage: 'Please, re-enter your password and try again.',
              },
            }),
          },
          'There was a conflict with your GxAlert credentials': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.409.thereWasAConflictWithYourCredentials.title',
                defaultMessage: "Couldn't login with your credentials",
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.409.thereWasAConflictWithYourCredentials.message',
                defaultMessage:
                  'There was a conflict with your credentials. Please, contact an administrator for support.',
              },
            }),
          },
        },
        409: {
          "Couldn't connect to GxAlert": {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.409.couldntConnectToGxAlert.title',
                defaultMessage: 'Login failed',
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.409.couldntConnectToGxAlert.message',
                defaultMessage:
                  "We couldn't establish connection with GxAlert. If you are trying to login with an Aspect user, you probably entered invalid credentials.",
              },
            }),
          },
        },
        403: {
          default: data => {
            dispatch(showServiceDegradation({ message: data.message, variant: 'error' }))
          },
          'Your account is locked.': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.403.accountLocked.title',
                defaultMessage: 'Login failed',
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.403.accountLocked.message',
                defaultMessage: 'Your user account has been locked',
              },
              resolution: {
                id: 'errorResponseMessages.loginStart.POST.403.accountLocked.resolution',
                defaultMessage: 'You can contact us to unlock your account for you by email ({supportEmail})',
              },
            }),
            messageValues: {
              supportEmail: config.supportEmail,
            },
          },
        },
        417: {
          'Your credentials were not configured properly. Please, contact your administrator.': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id: 'errorResponseMessages.loginStart.POST.417.missingPermissions.title',
                defaultMessage: 'Login failed',
              },
              message: {
                id: 'errorResponseMessages.loginStart.POST.417.missingPermissions.message',
                defaultMessage: 'Your credentials were not configured properly. Please, contact your administrator.',
              },
              resolution: {
                id: 'errorResponseMessages.loginStart.POST.417.missingPermissions.resolution',
                defaultMessage: 'You can contact us to check your account by email ({supportEmail})',
              },
            }),
            messageValues: {
              supportEmail: config.supportEmail,
            },
          },
        },
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.loginStart.POST.default.title',
              defaultMessage: 'Login Error',
            },
          })
        ),
      },
    })
      .then(json => {
        if (json.activeStatus === 1 && json.statusMessage) {
          dispatch(showServiceDegradation({ message: json.statusMessage, variant: 'warning' }))
        }
        if (json.notificationWarningMessage) {
          dispatch(showServiceDegradation({ message: json.notificationWarningMessage, variant: 'warning' }))
        }
        dispatch(
          loginSuccess(requestedAt, {
            access: json.access,
            refresh: json.refresh,
            clientId: json.clientId,
            countryId: json.countryId,
            culture: json.culture,
            countryAbbreviation: json.countryAbbreviation,
            timezoneId: json.timezone,
            displayPreferences: Immutable.Map(json.displayPreferences),
            loggedOutReason: '',
            userId: json.userId,
            personId: json.personId,
          })
        )
      })
      .catch(err => dispatch(loginFailure(err)))
  }
}

export function userRequestedLogout() {
  return {
    type: types.LOGOUT,
    data: { reason: reasonTypes.userRequested },
  }
}

export function idleLogout() {
  return {
    type: types.LOGOUT,
    data: { reason: reasonTypes.idle },
  }
}

export function expiredTokenLogout() {
  return {
    type: types.LOGOUT,
    data: { reason: reasonTypes.expiredJWT },
  }
}

function refreshSuccess(data) {
  return {
    type: types.REFRESH_SUCCESS,
    data,
  }
}

function refreshFailure() {
  return {
    type: types.REFRESH_FAILURE,
    data: { reason: reasonTypes.refreshJWTFailure },
  }
}

export function refreshStart() {
  return function (dispatch) {
    // const state = getState()
    // const { clientId, refresh } = state.user
    const token = localStorage.getItem('asRefresh')
    if (!token) {
      return Promise.resolve()
    }

    const clientId = localStorage.getItem('asClientId')
    // try to get a new access token:
    return aspectFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token, clientId, clientType: 'web' }),
    })
      .then(json =>
        dispatch(
          refreshSuccess({
            access: json.access,
            refresh: json.refresh,
            clientId: json.clientId,
            countryId: json.countryId,
            culture: json.culture,
            countryAbbreviation: json.countryAbbreviation,
            timezoneId: json.timezone,
            displayPreferences: Immutable.Map(json.displayPreferences),
            userId: json.userId,
            personId: json.personId,
          })
        )
      )
      .catch(() => {
        dispatch(refreshFailure())
      })
  }
}

export function resetPasswordEnterEmailAddress(emailAddress) {
  return function (dispatch, getState) {
    const state = getState()
    const { clientId } = state.user

    return aspectFetch(`/auth/send-reset-password-token/${emailAddress}`, {
      method: 'POST',
      body: JSON.stringify({
        clientId,
        clientName: getClientName(),
      }),
      errorNotifications: {
        default: inlineErrorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.resetPasswordEnterEmailAddress.POST.default.title',
              defaultMessage: 'Error Sending Reset Password Email',
            },
          })
        ),
      },
    }).catch(err => {
      throw new SubmissionError({ _error: err.message })
    })
  }
}

function createResetPasswordEnterPasswordSuccess(username) {
  return {
    type: types.RESET_PASSWORD_ENTER_PASSWORD_SUCCESS,
    username,
  }
}

export function resetPasswordEnterPassword(resetPasswordToken, newPassword) {
  return function (dispatch, getState) {
    const state = getState()
    const { clientId } = state.user

    return aspectFetch(`/auth/update-password/${resetPasswordToken}`, {
      method: 'PUT',
      body: JSON.stringify({
        newPassword,
        clientId,
        clientName: getClientName(),
      }),
      errorNotifications: {
        default: inlineErrorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.resetPasswordEnterPassword.POST.default.title',
              defaultMessage: 'Error Saving New Password',
            },
          })
        ),
      },
    })
      .then(json => {
        dispatch(createResetPasswordEnterPasswordSuccess(json.username))
      })
      .catch(err => {
        throw new SubmissionError({ _error: err.message })
      })
  }
}

function requestLicense() {
  return {
    type: types.REQUEST_LICENSE,
  }
}

function receiveLicense(data) {
  return {
    type: types.RECEIVE_LICENSE,
    data,
  }
}

export function fetchLicense(licenseId) {
  return dispatch => {
    dispatch(requestLicense())

    return aspectFetch(`/auth/license?licenseId=${licenseId}`).then(json => dispatch(receiveLicense(json.data)))
  }
}

function acceptLicenseRequest(requestedAt) {
  return {
    type: types.ACCEPT_LICENSE_REQUEST,
    requestedAt,
  }
}

function acceptLicenseSuccess(requestedAt, data) {
  return {
    type: types.ACCEPT_LICENSE_SUCCESS,
    requestedAt,
    data,
  }
}

function acceptLicenseFailure(err) {
  return {
    type: types.ACCEPT_LICENSE_FAILURE,
    err,
  }
}

export function acceptLicenseStart(licenseId) {
  return function (dispatch, getState) {
    // First dispatch: the app state is updated to inform
    // that the API call is starting.
    const requestedAt = Date.now()
    dispatch(acceptLicenseRequest(requestedAt))

    const state = getState()
    const { clientId, refresh } = state.user

    return aspectFetch('/auth/license', {
      method: 'POST',
      body: JSON.stringify({
        licenseId,
        clientId,
        token: refresh,
      }),
      errorNotifications: {
        default: errorPleaseTryAgainInAFewMinutes(
          defineMessages({
            title: {
              id: 'errorResponseMessages.loginStart.POST.default.title',
              defaultMessage: 'Login Error',
            },
          })
        ),
      },
    })
      .then(json =>
        dispatch(
          acceptLicenseSuccess(requestedAt, {
            access: json.access,
            refresh: json.refresh,
            clientId: json.clientId,
            culture: json.culture,
            countryAbbreviation: json.countryAbbreviation,
            timezoneId: json.timezone,
            displayPreferences: Immutable.Map(json.displayPreferences),
            countryId: json.countryId,
          })
        )
      )
      .catch(err => dispatch(acceptLicenseFailure(err)))
  }
}

/*
 * ---------------- Reducers -----------------
 */
const JWT = Immutable.Record({
  name: '',
  permissions: Immutable.Set(),
  jobFunctionNames: Immutable.Set(),
  hasToAcceptLicenseId: undefined,
  iat: undefined,
  exp: undefined,
  iss: '',
})
const User = Immutable.Record({
  requestedAt: undefined,
  jwt: new JWT(),
  access: undefined,
  refresh: undefined,
  clientId: undefined,
  culture: previousCulture || currentCulture,
  timezoneId: 'Eastern Standard Time',
  displayPreferences: Immutable.Map(),
  countryAbbreviation: null,
  loggedOutReason: '',
  licenseContent: undefined,
  countryId: undefined,
  userId: undefined,
  personId: undefined,
})

const initialState = new User()

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case types.LOGIN_REQUEST:
    case types.ACCEPT_LICENSE_REQUEST:
      return state.set('requestedAt', action.requestedAt)
    case types.LOGIN_SUCCESS:
    case types.REFRESH_SUCCESS:
    case types.ACCEPT_LICENSE_SUCCESS:
      return state.withMutations(mutState => {
        mutState.delete('requestedAt')
        mutState.delete('licenseContent')

        forEach(action.data, (v, k) => {
          if (!isNil(v)) {
            mutState.set(k, v)
          }
        })
        mutState.mergeDeepIn(
          ['jwt'],
          pick(jwtDecode(action.data.access), [
            'name',
            'permissions',
            'jobFunctionNames',
            'hasToAcceptLicenseId',
            'iat',
            'exp',
            'iss',
          ])
        )
      })
    case types.LOGIN_FAILURE:
    case types.ACCEPT_LICENSE_FAILURE:
      return state.delete('requestedAt')

    // fallthrough
    case types.REFRESH_FAILURE:
    case types.LOGOUT:
      sessionStorage.clear()
      return state.clear().set('loggedOutReason', action.data.reason)

    case types.RESET_PASSWORD_ENTER_PASSWORD_SUCCESS:
      return state
    case types.RECEIVE_LICENSE:
      return state.set('licenseContent', action.data.content)
    default:
      return state
  }
}
