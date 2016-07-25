import React from 'react'
import {Router, Route, IndexRoute, Redirect, browserHistory, applyRouterMiddleware } from 'react-router'
import useScroll from 'react-router-scroll'

// higher level containers/shells
import App from './components/App'
import LoggedInShell from './components/LoggedInShell'

// "Pages"
import Login from './components/Login'
import { DashboardContainer } from './components/pages/dashboard/Dashboard'
import { Inventory } from './components/pages/dashboard/Inventory'
import { Maintenance } from './components/pages/dashboard/Maintenance'
import { DeviceListContainer } from './components/pages/device/DeviceList'
import { PersonListContainer } from './components/pages/person/PersonList'
import { NotFoundContainer } from './components/pages/error/NotFound'
import { ResultList } from './components/pages/result/ResultList'
import { NotificationList } from './components/pages/notification/NotificationList'
import { ReportList } from './components/pages/report/ReportList'

function requireAuth(nextState, replace) {
  // TODO: check access level based on tokens/roles in jwt
  if (!window.localStorage.jwt ||
    !window.localStorage.jwt_expires ||
    window.localStorage.jwt_expires < Math.floor(Date.now() / 1000)) {

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

        <Redirect from='/' to='dashboard' />

        <Route path="dashboard" >
          <IndexRoute component={DashboardContainer} />
          <Route path="inventory" component={Inventory} />
          <Route path="maintenance" component={Maintenance} />
        </Route>

        <Route path="/device" component={DeviceListContainer} />

        <Route path="/result" component={ResultList} />

        <Route path="/person" component={PersonListContainer} />

        <Route path="/notification" component={NotificationList} />

        <Route path="/report" component={ReportList} />

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
