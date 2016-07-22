import React from 'react'
import {Router, Route, IndexRoute, Redirect, browserHistory, applyRouterMiddleware } from 'react-router'
import useScroll from 'react-router-scroll'

// higher level containers/shells
import App from './components/App'
import LoggedInShell from './components/LoggedInShell'

// "Pages"
import Login from './components/Login'
import { DashboardContainer } from './components/pages/Dashboard'
import { DeviceListContainer } from './components/pages/DeviceList'
import { PersonListContainer } from './components/pages/PersonList'
import { NotFoundContainer } from './components/pages/NotFound'

function requireAuth(nextState, replace) {
  // TODO: check access level based on tokens/roles in jwt
  if (!window.localStorage.access ||
    !window.localStorage.access_expires ||
    window.localStorage.access_expires < Math.floor(Date.now() / 1000)) {

    // if no access token or it is expired or expires within 10 minutes (600s),
    // try to refresh if we have a refresh token
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

const routes =
  <Router history={browserHistory} render={applyRouterMiddleware(useScroll()) }>
    <Route component={App}>
      <Route component={Login} path="login" />
      <Route component={LoggedInShell}
        onEnter={(nextState, replace) => requireAuth(nextState, replace) }>
        
        <Redirect from='/' to='/dashboard' />

        <Route name="dashboard" path="/dashboard" >
          <IndexRoute component={DashboardContainer} />
          <Route path="/devices" component={DeviceListContainer} />
        </Route>
        
        <Route path="/devices" component={DeviceListContainer} />
        
        <Route path="/persons" component={PersonListContainer} />
      
      </Route>
      <Route path="*" component={NotFoundContainer} />
    </Route>
  </Router>

class Routes extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (
      routes
    )
  }
}

export { Routes, browserHistory }
