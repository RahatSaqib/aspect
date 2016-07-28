import config from 'config'
import jwt_decode from 'jwt-decode'
import { push } from 'react-router-redux'

import util from './../util'
import { addError } from './error_creators'
import types from './../constants/action_types'

export function loginRequest() {
  return {
    type: types.LOGIN_REQUEST
  }
}

export function loginSuccess(name, culture, lang) {

  return {
    type: types.LOGIN_SUCCESS,
    name,
    culture,
    lang,
    drawerOpen: window.localStorage.drawerOpen === 'true'
  }
}

export function refreshSuccess(name, culture, lang) {

  let db = window.localStorage

  return {
    type: types.LOGIN_SUCCESS,
    name,
    culture,
    lang,
    drawerOpen: db.drawerOpen === 'true'
  }
}

export function hydrateFromLocalStorage() {

  let db = window.localStorage

  return {
    type: types.LOGIN_SUCCESS,
    culture: db.culture,
    lang: db.lang,
    drawerOpen: db.drawerOpen === 'true'
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

export function changeLanguage(lang) {

  window.localStorage.lang = lang

  // todo: update in db
  return {
    type: types.CHANGE_LANGUAGE,
    lang
  }
}

export function toggleDrawer() {

  let drawerOpen = window.localStorage.drawerOpen === 'true'

  window.localStorage.drawerOpen = !drawerOpen

  return {
    type: types.TOGGLE_DRAWER,
    drawerOpen: !drawerOpen
  }
}

export function closeDrawer() {

  window.localStorage.drawerOpen = false

  return {
    type: types.TOGGLE_DRAWER,
    drawerOpen: false
  }
}

export function loginStart(user, password) {

  return function (dispatch) {

    // First dispatch: the app state is updated to inform
    // that the API call is starting.
    dispatch(loginRequest())

    // The function called by the thunk middleware can return a value,
    // that is passed on as the return value of the dispatch method

    // In this case, we return a promise to wait for.
    // This is not required by thunk middleware, but it is convenient for us.
    let clientName = util.getBrowserNameAndVersion() + ' on ' + window.navigator.platform

    return fetch(config.aspectApi + '/auth',
      {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user,
          password: password,
          clientId: window.localStorage.clientId,
          clientName: clientName
        })
      })
      .then(util.handleFetchError)
      .then(json => {

        let jwt = storeAccess(json)

        // We can dispatch many times!
        // Here, we update the app state with the results of the API call.
        dispatch(loginSuccess(jwt.name, jwt.culture, jwt.lang))

        dispatch(push('/dashboard'))
      })
      .catch(err => {
        dispatch(loginFailure(err))
        dispatch(addError('Login Failed', err.message, err))
      })
  }
}

export function logoutStart() {

  return function (dispatch) {

    // remove access and refresh tokens
    window.localStorage.removeItem('access')
    window.localStorage.removeItem('access_expires')
    window.localStorage.removeItem('refresh')
    window.localStorage.removeItem('user')
    window.localStorage.removeItem('lang')
    window.localStorage.removeItem('culture')

    // let the app know that we're now logged out
    dispatch(logoutSuccess())

    // now, redirct to login page
    dispatch(push('/login'))
  }
}

export function refreshStart() {
  return function (dispatch) {
    // try to get a new access token:
    fetch(config.aspectApi + '/auth/refresh',
      {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: window.localStorage.refresh,
          clientId: window.localStorage.clientId
        })
      })
      .then(util.handleFetchError)
      .then(json => {
        let jwt = storeAccess(json)

        dispatch(refreshSuccess(jwt.name, jwt.culture, jwt.lang))
      })
      .catch(() => {
        dispatch(logoutStart())
      })
  }
}

function storeAccess(json) {
  // Store jwt, refresh token, and clientId
  let jwt = jwt_decode(json.access)
  let db = window.localStorage
  db.jwt = json.access
  db.jwt_expires = jwt.exp
  db.refresh = json.refresh
  db.clientId = json.clientId
  db.lang = jwt.culture.substring(0, 2)
  db.culture = jwt.culture

  return jwt
}
