import types from './../constants/action_types'

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

export function logOut() {
  return {
    type: types.LOG_OUT
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

// TODO: turn this into a dispatch on a new error-object that
// all components have access to.
// that way, we can display a nice error message in the browser
function handleError(resp) {
  let json = resp.json()
  if (resp.ok) {
    return json
  } else {
    return json.then(Promise.reject.bind(Promise))
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
    return fetch('http://localhost:8080/api/auth',
                  { method: 'POST',
                    mode: 'cors',
                    headers: {  'Content-Type': 'application/json' },
                    body:  JSON.stringify({  name: user,
                              password: password,
                              clientId: 'Browser XYZ',
                              clientName: 'Stefans machine' })})
      .then(handleError)
      .then(json => {

        // TODO: Store jwt and refresh token
        console.log(json)

        // We can dispatch many times!
        // Here, we update the app state with the results of the API call.
        dispatch(loginSuccess(user, '/'))
      })
      .catch(err => {
        dispatch(loginFailure(err))
        dispatch(addError('Login Failed', err.message, err))
      })
  }
}
