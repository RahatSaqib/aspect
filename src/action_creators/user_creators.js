import config from 'config'
import jwt_decode from 'jwt-decode'

import util from './../util'
import * as localStorage from '../utils/localStorage'
import { history } from '../store'
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
    drawerOpen: localStorage.isDrawlerOpen()
  }
}

export function refreshSuccess(name, culture, lang) {

  return {
    type: types.LOGIN_SUCCESS,
    name,
    culture,
    lang,
    drawerOpen: localStorage.isDrawlerOpen()
  }
}

export function hydrateFromLocalStorage() {

  return {
    type: types.LOGIN_SUCCESS,
    culture: localStorage.getCulture(),
    lang: localStorage.getLang(),
    drawerOpen: localStorage.isDrawlerOpen()
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

export function changeLanguage(lang, culture) {
  localStorage.updateLanguageAndCulture(lang, culture)

  // todo: update in db, separate culture
  return {
    type: types.CHANGE_LANGUAGE,
    lang,
    culture
  }
}

export function toggleDrawer() {

  localStorage.toggleDrawlerOpen()

  return {
    type: types.TOGGLE_DRAWER,
    drawerOpen: localStorage.isDrawlerOpen()
  }
}

export function closeDrawer() {

  localStorage.closeDrawler()

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
        headers: util.getHeaders(true),
        body: JSON.stringify({
          name: user,
          password: password,
          clientId: localStorage.getClientId(),
          clientName: clientName
        })
      })
      .then(util.handleFetchError)
      .then(json => {

        let jwt = storeAccess(json)

        // We can dispatch many times!
        // Here, we update the app state with the results of the API call.
        dispatch(loginSuccess(jwt.name, jwt.culture, jwt.lang))

        history.push('/dashboard')
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
    localStorage.clear()

    // let the app know that we're now logged out
    dispatch(logoutSuccess())

    // now, redirct to login page
    history.push('/login')
  }
}

export function refreshStart() {
  return function (dispatch) {

    if (!localStorage.getRefreshToken()){
      return
    }

    // try to get a new access token:
    fetch(config.aspectApi + '/auth/refresh',
      {
        method: 'POST',
        headers: util.getHeaders(true),
        body: JSON.stringify({
          token: localStorage.getRefreshToken(),
          clientId: localStorage.getClientId()
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
  const jwt = jwt_decode(json.access)

  localStorage.store(json.access, jwt.exp, json.refresh, json.clientId)

  const lang = jwt.culture.substring(0, 2)
  localStorage.updateLanguageAndCulture(lang, jwt.culture)

  return jwt
}
