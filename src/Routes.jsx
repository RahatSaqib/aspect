import React from 'react'
import {Router, Route, browserHistory} from 'react-router'
import jwt_decode from 'jwt-decode'

import App from './components/App'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import LoggedInShell from './components/LoggedInShell'
import util from './util'

function requireAuth(nextState, replace) {
  // TODO: Actually check if user is logged in here
  // Right now, just checking if an access token was
  // set in local storage.
  if (!window.localStorage.access ||
      !window.localStorage.access_expires ||
      window.localStorage.access_expires < Math.floor(Date.now() / 1000) - 600) {

    // if no access token or it is expired or expires within 10 minutes (600s),
    // try to refresh
    // do we have a refresh token to get a new access token?
    if (!window.localStorage.refresh){
      replace({
        pathname: '/login',
        state: { nextPathname: nextState.location.pathname }
      })
    } else {
      // try to get a new access token:
      fetch('http://localhost:8080/api/auth/refresh',
                  { method: 'POST',
                    mode: 'cors',
                    headers: {  'Content-Type': 'application/json' },
                    body:  JSON.stringify({  token: window.localStorage.refresh,
                              clientId: window.localStorage.clientId })})
      .then(util.handleFetchError)
      .then(json => {
        // Store jwt, refresh token, and clientId
        let jwt = jwt_decode(json.access)
        window.localStorage.access = json.access
        window.localStorage.access_expires = jwt.exp
        window.localStorage.refresh = json.refresh
        window.localStorage.clientId = json.clientId
        window.localStorage.user = jwt.name
      })
      .catch(() => {
        // error when trying to get a new access token. go to login page.
        replace({
          pathname: '/login',
          state: { nextPathname: nextState.location.pathname }
        })
      })
    }
  }
}

// set up routes for react-router
const routes =
<Route component={App}>
  <Route component={Login} path="login" />
    <Route component={LoggedInShell} onEnter={requireAuth}>
      <Route path="/(:login)" component={Dashboard} />
  </Route>
</Route>

class Routes extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Router history={browserHistory}>{routes}</Router>
    )
  }
}

export { Routes, browserHistory }
