import { stringify } from 'querystring'
import Immutable from 'immutable'
import jwtDecode from 'jwt-decode'
import { browserHistory } from 'react-router'
import { SubmissionError } from 'redux-form/immutable'
import { getBrowserNameAndVersion } from '../shared/utils/browser'
import { aspectFetch, getHeaders } from '../shared/utils/fetch'
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
  RESET_PASSWORD_ENTER_PASSWORD_SUCCESS: 'RESET_PASSWORD_ENTER_PASSWORD_SUCCESS'
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
    const clientName = `${getBrowserNameAndVersion()} on ${window.navigator.platform}`

    return aspectFetch('/auth',
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: user,
          password,
          clientId: localStorage.getClientId(),
          clientName
        })
      })
      .then((json) => {
        const jwt = storeAccess(json)

        // We can dispatch many times!
        // Here, we update the app state with the results of the API call.
        dispatch(loginSuccess(jwt.name, jwt.culture, jwt.timezone, jwt.permissions))

        browserHistory.push('/dashboard')
      })
      .catch((err) => {
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
    browserHistory.push(`/login${typeof reason === 'string' ? `?${stringify({ reason })}` : ''}`)
  }
}

export function refreshStart() {
  return function (dispatch) {
    if (!localStorage.getRefreshToken()) {
      return
    }

    // try to get a new access token:
    return aspectFetch('/auth/refresh',
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          token: localStorage.getRefreshToken(),
          clientId: localStorage.getClientId()
        })
      })
      .then((json) => {
        const jwt = storeAccess(json)

        dispatch(refreshSuccess(jwt.name, jwt.culture, jwt.timezone, jwt.permissions))
      })
      .catch(() => {
        dispatch(logoutStart())
      })
  }
}

function storeAccess(json) {
  // Store jwt, refresh token, and clientId
  const jwt = jwtDecode(json.access)

  localStorage.store(json.access, jwt.exp, json.refresh, json.clientId)

  localStorage.updateCulture(jwt.culture)
  localStorage.updateTimezone(jwt.timezone)
  return jwt
}

function createResetPasswordEnterPasswordSuccess(username) {
  return {
    type: types.RESET_PASSWORD_ENTER_PASSWORD_SUCCESS,
    username
  }
}

export function resetPasswordEnterEmailAddress(emailAddress) {
  return function () {
    const clientName = `${getBrowserNameAndVersion()} on ${window.navigator.platform}`
    return aspectFetch(`/auth/send-reset-password-token/${emailAddress}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          clientId: localStorage.getClientId(),
          clientName
        })
      })
      .catch((err) => {
        throw new SubmissionError({ _error: err.message })
      })
  }
}

export function resetPasswordEnterPassword(resetPasswordToken, newPassword) {
  return function (dispatch) {
    const clientName = `${getBrowserNameAndVersion()} on ${window.navigator.platform}`
    return aspectFetch(`/auth/update-password/${resetPasswordToken}`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          newPassword,
          clientId: localStorage.getClientId(),
          clientName
        })
      })
      .then((json) => {
        dispatch(createResetPasswordEnterPasswordSuccess(json.username))
      })
      .catch((err) => {
        throw new SubmissionError({ _error: err.message })
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
  permissions: Immutable.Set(),
  drawerOpen: true,
  loggedIn: false
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
      return state.mergeDeep({
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
    case types.RESET_PASSWORD_ENTER_PASSWORD_SUCCESS:
      return state.merge({
        name: action.username
      })
    default:
      return state
  }
}
