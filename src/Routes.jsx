import React from 'react'
import {Router, Route, browserHistory} from 'react-router'
import App from './components/App'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import LoggedInShell from './components/LoggedInShell'

function requireAuth(nextState, replace) {
  // TODO: Actually check if user is logged in here
  // Right now, just checking if an access token was
  // set in local storage.
  if (!window.sessionStorage.accessToken) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
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
