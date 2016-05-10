import jwt_decode from 'jwt-decode'
import types from './../constants/action_types'
import util from './../util'

export function init(name){
  return {
    type: types.LOGIN_SUCCESS,
    name
  }
}

export function loginRequest() {
  return {
    type: types.LOGIN_REQUEST
  }
}

export function loginSuccess(name) {
  return {
    type: types.LOGIN_SUCCESS,
    name,
    meta: {
      transition: () => ({
        pathname: '/',
        search: '?fl=1'
      })
    }
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
    type: types.LOGOUT_SUCCESS,
    meta: {
      transition: () => ({
        pathname: '/login'
      })
    }
  }
}

export function addError(title, desc, obj){
  return {
    type: types.ADD_ERROR,
    error: { title: title, desc: desc, obj: obj }
  }
}

export function removeError(){
  return {
    type: types.REMOVE_ERROR
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

    return fetch('http://localhost:8080/api/auth',
                  { method: 'POST',
                    mode: 'cors',
                    headers: {  'Content-Type': 'application/json' },
                    body:  JSON.stringify({  name: user,
                              password: password,
                              clientId: window.localStorage.clientId,
                              clientName: clientName })})
      .then(util.handleFetchError)
      .then(json => {

        // Store jwt, refresh token, and clientId
        let jwt = jwt_decode(json.access)
        window.localStorage.access = json.access
        window.localStorage.access_expires = jwt.exp
        window.localStorage.refresh = json.refresh
        window.localStorage.clientId = json.clientId
        window.localStorage.user = jwt.name

        // We can dispatch many times!
        // Here, we update the app state with the results of the API call.
        dispatch(loginSuccess(user))
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

    // First dispatch: the app state is updated to inform
    // that the API call is starting.
    dispatch(logoutSuccess())
  }
}
