import React from 'react'
import {Router, Route, browserHistory} from 'react-router'

import App from './components/App'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import LoggedInShell from './components/LoggedInShell'
import { refreshStart } from './action_creators/action_creators'

function requireAuth(nextState, replace, store) {
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
      store.dispatch(refreshStart())
    }
  }
}

class Routes extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Router history={browserHistory}>
        <Route component={App}>
          <Route component={Login} path="login" />
            <Route component={LoggedInShell} onEnter={(nextState, replace) => requireAuth(nextState, replace, this.props.store)}>
              <Route path="/(:login)" component={Dashboard} />
          </Route>
        </Route>
      </Router>
    )
  }
}

export { Routes, browserHistory }
