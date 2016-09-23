import React from 'react'
import { Router, Route, IndexRoute, Redirect, applyRouterMiddleware } from 'react-router'
import { useScroll } from 'react-router-scroll'
import store, { history } from './store'

// higher level containers/shells
import App from './components/App'
import LoggedInShell from './components/LoggedInShell'

// "Pages"
import { LoginContainer } from './components/pages/auth/Login'
import { DashboardContainer } from './components/pages/dashboard/Dashboard'
import { Inventory } from './components/pages/dashboard/Inventory'
import { Maintenance } from './components/pages/dashboard/Maintenance'
import { DeviceListContainer } from './components/pages/device/DeviceList'
import { DeviceDetailContainer } from './components/pages/device/DeviceDetail'
import { SiteListContainer } from './components/pages/site/SiteList'
import { PersonListContainer } from './components/pages/person/PersonList'
import { NotFoundContainer } from './components/pages/error/NotFound'
import { ResultList } from './components/pages/result/ResultList'
import { NotificationList } from './components/pages/notification/NotificationList'
import { ReportList } from './components/pages/report/ReportList'

import { refreshStart } from './action_creators/user_creators'

import { hasBlankOrExpiredJWT, getRefreshToken } from './utils/localStorage'

function requireAuth(nextState, replace) {
  // TODO: check access level based on tokens/roles in jwt
  if (hasBlankOrExpiredJWT()) {
    // try to refresh if we have a refresh token
    // if not, redirect to login
    if (getRefreshToken()){
      store.dispatch(refreshStart())
    }  else {
      replace({
        pathname: '/login',
        state: { nextPathname: nextState.location.pathname }
      })
    }
  }
}

const routes =
  <Router history={history} render={applyRouterMiddleware(useScroll()) }>
    <Route component={App}>
      <Route component={LoginContainer} path="login" />
      <Route component={LoggedInShell}
        onChange={(prevState, nextState, replace) => requireAuth(nextState, replace) }>

        <Redirect from='/' to='dashboard' />

        <Route path="dashboard" >
          <IndexRoute component={DashboardContainer} />
          <Route path="inventory" component={Inventory} />
          <Route path="maintenance" component={Maintenance} />
        </Route>

        <Route path="device">
          <IndexRoute component={DeviceListContainer} />
          <Route path=":deviceId" component={DeviceDetailContainer} />
        </Route>

        <Route path="/result" component={ResultList} />

        <Route path="/site" component={SiteListContainer} />

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

export default Routes
