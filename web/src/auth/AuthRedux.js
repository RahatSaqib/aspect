import { stringify } from 'querystring'
import Immutable from 'immutable'
import jwt_decode from 'jwt-decode'
import { browserHistory } from 'react-router'
import { aspectFetch, getHeaders, getBrowserNameAndVersion } from '../shared/utils/fetch'
import * as localStorage from '../shared/utils/localStorage'
import { addError } from '../error/ErrorRedux'

export const types = {
  HYDRATE_FROM_LOCAL_STORAGE: 'HYDRATE_FROM_LOCAL_STORAGE',
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',
  CHANGE_CULTURE: 'CHANGE_CULTURE',
  TOGGLE_DRAWER: 'TOGGLE_DRAWER',
  CHANGE_TIMEZONE: 'CHANGE_TIMEZONE',
  RESET_PASSWORD_ENTER_EMAIL_ADDRESS: 'RESET_PASSWORD_ENTER_EMAIL_ADDRESS',
  RESET_PASSWORD_ENTER_EMAIL_ADDRESS_SUCCESS: 'RESET_PASSWORD_ENTER_EMAIL_ADDRESS_SUCCESS',
  RESET_PASSWORD_ENTER_EMAIL_ADDRESS_FAILED: 'RESET_PASSWORD_ENTER_EMAIL_ADDRESS_FAILED',
  RESET_PASSWORD_GET_TOKEN: 'RESET_PASSWORD_GET_TOKEN',
  RESET_PASSWORD_ENTER_PASSWORD: 'RESET_PASSWORD_ENTER_PASSWORD',
  RESET_PASSWORD_ENTER_PASSWORD_SUCCESS: 'RESET_PASSWORD_ENTER_PASSWORD_SUCCESS',
  RESET_PASSWORD_ENTER_PASSWORD_FAILED: 'RESET_PASSWORD_ENTER_PASSWORD_FAILED'
}
/*
 * ---------------- Action Creators -----------------
 */
export function loginRequest() {
  return {
    type: types.LOGIN_REQUEST
  }
}

export function loginSuccess(name, culture, timezone, permissions) {
  return {
    type: types.LOGIN_SUCCESS,
    name,
    culture,
    timezone,
    permissions,
    drawerOpen: localStorage.isDrawerOpen()
  }
}

export function refreshSuccess(name, culture, timezone, permissions) {

  return {
    type: types.LOGIN_SUCCESS,
    name,
    culture,
    timezone,
    permissions,
    drawerOpen: localStorage.isDrawerOpen()
  }
}

export function hydrateFromLocalStorage() {

  return {
    type: types.HYDRATE_FROM_LOCAL_STORAGE,
    culture: localStorage.getCulture(),
    timezone: localStorage.getTimezone(),
    drawerOpen: localStorage.isDrawerOpen()
  }
}

export function loginFailure(err) {
  return {
    type: types.LOGIN_FAILURE,
    err
  }
}

export function logoutSuccess() {
  return {
    type: types.LOGOUT_SUCCESS
  }
}

export function changeCulture(culture) {
  localStorage.updateCulture(culture)
  return {
    type: types.CHANGE_CULTURE,
    culture
  }
}

export function changeTimezone(timezone) {
  localStorage.updateTimezone(timezone)
  return {
    type: types.CHANGE_TIMEZONE,
    timezone
  }
}

export function toggleDrawer() {

  localStorage.toggleDrawerOpen()

  return {
    type: types.TOGGLE_DRAWER,
    drawerOpen: localStorage.isDrawerOpen()
  }
}

export function closeDrawer() {

  localStorage.closeDrawer()

  return {
    type: types.TOGGLE_DRAWER,
    drawerOpen: false
  }
}

export function loginStart(login) {
  const user = login.get('user')
  const password = login.get('password')

  return function (dispatch) {

    // First dispatch: the app state is updated to inform
    // that the API call is starting.
    dispatch(loginRequest())

    // The function called by the thunk middleware can return a value,
    // that is passed on as the return value of the dispatch method

    // In this case, we return a promise to wait for.
    // This is not required by thunk middleware, but it is convenient for us.
    const clientName = getBrowserNameAndVersion() + ' on ' + window.navigator.platform

    return aspectFetch('/auth',
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: user,
          password: password,
          clientId: localStorage.getClientId(),
          clientName: clientName
        })
      })
      .then(json => {

        let jwt = storeAccess(json)

        // We can dispatch many times!
        // Here, we update the app state with the results of the API call.
        dispatch(loginSuccess(jwt.name, jwt.culture, jwt.timezone, jwt.permissions))

        browserHistory.push('/dashboard')
      })
      .catch(err => {
        dispatch(loginFailure(err))
        dispatch(addError('Login Failed', err.message, err))
      })
  }
}

export function logoutStart(reason) {

  return function (dispatch) {

    // remove access and refresh tokens
    localStorage.clear()

    // let the app know that we're now logged out
    dispatch(logoutSuccess())

    // now, redirect to login page
    browserHistory.push('/login' + (typeof reason === 'string' ? '?' + stringify({ reason }) : ''))
  }
}

export function refreshStart() {
  return function (dispatch) {

    if (!localStorage.getRefreshToken()){
      return
    }

    // try to get a new access token:
    aspectFetch('/auth/refresh',
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          token: localStorage.getRefreshToken(),
          clientId: localStorage.getClientId()
        })
      })
      .then(json => {
        let jwt = storeAccess(json)

        dispatch(refreshSuccess(jwt.name, jwt.culture, jwt.timezone, jwt.permissions))
      })
      .catch(() => {
        dispatch(logoutStart())
      })
  }
}

function storeAccess(json) {
  // Store jwt, refresh token, and clientId
  const jwt = jwt_decode(json.access)

  localStorage.store(json.access, jwt.exp, json.refresh, json.clientId)

  localStorage.updateCulture(jwt.culture)
  localStorage.updateTimezone(jwt.timezone)
  return jwt
}

function createResetPasswordEnterEmailAddressRequest(emailAddress) {
  return {
    type: types.RESET_PASSWORD_ENTER_EMAIL_ADDRESS,
    emailAddress
  }
}

function createResetPasswordEnterEmailAddressSuccess(emailAddress) {
  return {
    type: types.RESET_PASSWORD_ENTER_EMAIL_ADDRESS_SUCCESS,
    emailAddress
  }
}

function createResetPasswordEnterEmailAddressFailure(error) {
  return {
    type: types.RESET_PASSWORD_ENTER_EMAIL_ADDRESS_FAILED,
    error
  }
}

function createResetPasswordGetToken(resetPasswordToken) {
  return {
    type: types.RESET_PASSWORD_GET_TOKEN,
    resetPasswordToken
  }
}

function createResetPasswordEnterPasswordRequest(resetPasswordToken, newPassword) {
  return {
    type: types.RESET_PASSWORD_ENTER_PASSWORD,
    resetPasswordToken,
    newPassword
  }
}

function createResetPasswordEnterPasswordSuccess(username) {
  return {
    type: types.RESET_PASSWORD_ENTER_PASSWORD_SUCCESS,
    username
  }
}

function createResetPasswordEnterPasswordFailure(error) {
  return {
    type: types.RESET_PASSWORD_ENTER_PASSWORD_FAILED,
    error
  }
}

export function resetPasswordEnterEmailAddress(emailAddress) {
  return function (dispatch) {
    dispatch(createResetPasswordEnterEmailAddressRequest(emailAddress))
    const clientName = getBrowserNameAndVersion() + ' on ' + window.navigator.platform
    return aspectFetch(`/auth/send-reset-password-token/${emailAddress}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          clientId: localStorage.getClientId(),
          clientName: clientName
        })
      })
      .then(() => {
        dispatch(createResetPasswordEnterEmailAddressSuccess(emailAddress))
      })
      .catch(err => {
        dispatch(createResetPasswordEnterEmailAddressFailure(err))
        dispatch(addError('Could not start resetting password', err.message, err))
      })
  }
}

export function resetPasswordSetToken(resetPasswordToken) {
  return function (dispatch) {
    dispatch(createResetPasswordGetToken(resetPasswordToken))
  }
}

export function resetPasswordEnterPassword(resetPasswordToken, newPassword) {
  return function (dispatch) {
    dispatch(createResetPasswordEnterPasswordRequest(resetPasswordToken, newPassword))
    const clientName = getBrowserNameAndVersion() + ' on ' + window.navigator.platform
    return aspectFetch(`/auth/update-password/${resetPasswordToken}`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          newPassword: newPassword,
          clientId: localStorage.getClientId(),
          clientName: clientName
        })
      })
      .then(json => {
        dispatch(createResetPasswordEnterPasswordSuccess(json.username))
      })
      .catch(err => {
        dispatch(createResetPasswordEnterPasswordFailure(err))
        dispatch(addError('Could not reset password', err.message, err))
      })
  }
}

/*
 * ---------------- Reducers -----------------
 */
const User = Immutable.Record({
  name: '',
  culture: 'en-US',
  timezone: 'Eastern Standard Time',
  permissions: Immutable.List(),
  drawerOpen: true,
  loggedIn: false,
  resetPasswordToken: '',
  resettingPassword: false,
  usernameReminder: ''
})

const initialState = new User()

export default function authReducer(state = initialState, action) {
  switch (action.type) {
  case types.HYDRATE_FROM_LOCAL_STORAGE:
    return state.merge({
      culture: action.culture,
      timezone: action.timezone,
      loggedIn: true
    })
  case types.LOGIN_REQUEST:
    return state.merge({ loggedIn: false })
  case types.LOGIN_SUCCESS:
    return state.merge({
      name: action.name,
      culture: action.culture,
      timezone: action.timezone,
      permissions: action.permissions,
      loggedIn: true,
      drawerOpen: action.drawerOpen
    })
  case types.LOGIN_FAILURE:
    return state.merge({ name: '', loggedIn: false })
  case types.LOGOUT_SUCCESS:
    return state.merge({ name: '', loggedIn: false })
  case types.CHANGE_CULTURE:
    return state.merge({
      culture: action.culture
    })
  case types.CHANGE_TIMEZONE:
    return state.merge({
      timezone: action.timezone
    })
  case types.TOGGLE_DRAWER:
    return state.merge({
      drawerOpen: action.drawerOpen
    })
  case types.RESET_PASSWORD_ENTER_EMAIL_ADDRESS:
    return state.set('resettingPassword', true)
  case types.RESET_PASSWORD_ENTER_EMAIL_ADDRESS_SUCCESS:
    return state.set('resettingPassword', false)
  case types.RESET_PASSWORD_ENTER_EMAIL_ADDRESS_FAILED:
    return state.set('resettingPassword', false)
  case types.RESET_PASSWORD_GET_TOKEN:
    return state.set('resetPasswordToken', action.resetPasswordToken)
  case types.RESET_PASSWORD_ENTER_PASSWORD:
    return state.set('resettingPassword', true)
  case types.RESET_PASSWORD_ENTER_PASSWORD_SUCCESS:
    return state.merge({
      resettingPassword: false,
      usernameReminder: action.username
    })
  case types.RESET_PASSWORD_ENTER_PASSWORD_FAILED:
    return state.set('resettingPassword', false)
  }
  return state
}
