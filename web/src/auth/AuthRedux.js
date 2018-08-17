import _ from 'lodash'
import { defineMessages } from 'react-intl'
import Immutable from 'immutable'
import jwtDecode from 'jwt-decode'
import { SubmissionError } from 'redux-form/immutable'

import config from '../config'
import { getClientName } from '../shared/utils/browser'
import { aspectFetch } from '../shared/utils/fetch'
import {
  errorPleaseTryAgainInAFewMinutes,
  inlineErrorPleaseTryAgainInAFewMinutes,
} from '../error/CommonErrorNotifications'
import { types as accountTypes } from '../account/AccountRedux'
import { reasonTypes } from './loggedOutReasons'

export const types = {
  HYDRATE_FROM_LOCAL_STORAGE: 'HYDRATE_FROM_LOCAL_STORAGE',

  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',

  REFRESH_SUCCESS: 'REFRESH_SUCCESS',
  REFRESH_FAILURE: 'REFRESH_FAILURE',

  LOGOUT: 'LOGOUT',

  TOGGLE_DRAWER: 'TOGGLE_DRAWER',
  CLOSE_DRAWER: 'CLOSE_DRAWER',

  RESET_PASSWORD_ENTER_PASSWORD_SUCCESS:
    'RESET_PASSWORD_ENTER_PASSWORD_SUCCESS',

  REQUEST_FEATURES: 'REQUEST_FEATURES',
  RECEIVE_FEATURES: 'RECEIVE_FEATURES',
}

/*
 * ---------------- Action Creators -----------------
 */
export function hydrateFromLocalStorage(data) {
  return {
    type: types.HYDRATE_FROM_LOCAL_STORAGE,
    data,
  }
}

export function toggleDrawer() {
  return {
    type: types.TOGGLE_DRAWER,
  }
}

export function closeDrawer() {
  return {
    type: types.CLOSE_DRAWER,
  }
}

function loginRequest(requestedAt) {
  return {
    type: types.LOGIN_REQUEST,
    requestedAt,
  }
}

function loginSuccess(requestedAt, data) {
  return {
    type: types.LOGIN_SUCCESS,
    requestedAt,
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
  return function(dispatch, getState) {
    // First dispatch: the app state is updated to inform
    // that the API call is starting.
    const requestedAt = Date.now()
    dispatch(loginRequest(requestedAt))

    const state = getState()
    const { clientId } = state.user

    return aspectFetch('/auth', {
      method: 'POST',
      body: JSON.stringify({
        name: user,
        password,
        clientId,
        clientName: getClientName(),
      }),
      errorNotifications: {
        401: {
          'Your account is locked.': {
            severity: 'warn',
            ...defineMessages({
              title: {
                id:
                  'errorResponseMessages.loginStart.POST.401.accountLocked.title',
                defaultMessage: 'Login Failed',
              },
              message: {
                id:
                  'errorResponseMessages.loginStart.POST.401.accountLocked.message',
                defaultMessage: 'Your user account has been locked',
              },
              resolution: {
                id:
                  'errorResponseMessages.loginStart.POST.401.accountLocked.resolution',
                defaultMessage:
                  'You can contact us to unlock your account for you by email ({supportEmail})',
              },
            }),
            messageValues: {
              supportEmail: config.supportEmail,
            },
          },
          default: {
            severity: 'warn',
            ...defineMessages({
              title: {
                id:
                  'errorResponseMessages.loginStart.POST.default.default.title',
                defaultMessage: 'Login Failed',
              },
              message: {
                id:
                  'errorResponseMessages.loginStart.POST.default.default.message',
                defaultMessage:
                  'The details that you have entered are incorrect',
              },
              resolution: {
                id: 'errorResponseMessages.loginStart.POST.default.resolution',
                defaultMessage:
                  'Please re-enter your login details and try again?',
              },
            }),
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
      .then(json =>
        dispatch(
          loginSuccess(requestedAt, {
            access: json.access,
            refresh: json.refresh,
            clientId: json.clientId,
            culture: json.culture,
            timezoneId: json.timezone,
            displayPreferences: Immutable.Map(json.displayPreferences),
          })
        )
      )
      .then(() => dispatch(fetchFeatures()))
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
  return function(dispatch, getState) {
    const state = getState()
    const { clientId, refresh } = state.user

    if (!refresh) {
      return Promise.resolve()
    }

    // try to get a new access token:
    return aspectFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        token: refresh,
        clientId,
      }),
    })
      .then(json =>
        dispatch(
          refreshSuccess({
            access: json.access,
            refresh: json.refresh,
            clientId: json.clientId,
          })
        )
      )
      .then(() => dispatch(fetchFeatures()))
      .catch(() => {
        dispatch(refreshFailure())
      })
  }
}

export function resetPasswordEnterEmailAddress(emailAddress) {
  return function(dispatch, getState) {
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
              id:
                'errorResponseMessages.resetPasswordEnterEmailAddress.POST.default.title',
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
  return function(dispatch, getState) {
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
              id:
                'errorResponseMessages.resetPasswordEnterPassword.POST.default.title',
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

function requestFeatures() {
  return {
    type: types.REQUEST_FEATURES,
  }
}

function receiveFeatures(data) {
  return {
    type: types.RECEIVE_FEATURES,
    data,
  }
}

export function fetchFeatures() {
  return dispatch => {
    dispatch(requestFeatures())

    return aspectFetch('/auth/features').then(json =>
      dispatch(receiveFeatures(json.data))
    )
  }
}

/*
 * ---------------- Reducers -----------------
 */
const JWT = Immutable.Record({
  name: '',
  permissions: Immutable.Set(),
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
  culture: 'en-US',
  timezoneId: 'Eastern Standard Time',
  displayPreferences: Immutable.Map(),
  drawerOpen: false,
  loggedOutReason: '',
  features: Immutable.Set(),
})

const initialState = new User()

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case types.LOGIN_REQUEST:
      return state.set('requestedAt', action.requestedAt)

    case types.HYDRATE_FROM_LOCAL_STORAGE:
      if (action.data === false) {
        return state
      }
    // fallthrough
    case types.LOGIN_SUCCESS:
    case types.REFRESH_SUCCESS:
    case accountTypes.RECEIVE_UPDATED_LOGIN_DETAILS:
      return state.withMutations(mutState => {
        mutState.delete('requestedAt')

        _.forEach(action.data, (v, k) => {
          if (!_.isNil(v)) {
            mutState.set(k, v)
          }
        })
        mutState.mergeDeepIn(
          ['jwt'],
          _.pick(jwtDecode(action.data.access), [
            'name',
            'permissions',
            'iat',
            'exp',
            'iss',
          ])
        )
      })
    case types.LOGIN_FAILURE:
      return state.delete('requestedAt')

    // fallthrough
    case types.REFRESH_FAILURE:
    case types.LOGOUT:
      return state.clear().set('loggedOutReason', action.data.reason)

    case types.TOGGLE_DRAWER:
      return state.set('drawerOpen', !state.drawerOpen)
    case types.CLOSE_DRAWER:
      return state.set('drawerOpen', false)

    case accountTypes.RECEIVE_UPDATED_USER_PREFERENCES:
      return state.merge({
        culture: action.accountDetails.culture,
        timezoneId: action.accountDetails.timezone,
      })

    case types.RESET_PASSWORD_ENTER_PASSWORD_SUCCESS:
      return state
    case types.RECEIVE_FEATURES:
      return state.set(
        'features',
        Immutable.Set(action.data.map(x => x.module))
      )
    default:
      return state
  }
}
