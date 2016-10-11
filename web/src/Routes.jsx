import React, { Component } from 'react'
import { Router, Route, IndexRoute, Redirect, applyRouterMiddleware } from 'react-router'
import { useScroll } from 'react-router-scroll'
import PiwikReactRouter from 'piwik-react-router'
import store, { history } from './store'
import config from 'config'

// higher level containers/shells
import App from './components/layouts/App'
import LoggedInShell from './components/layouts/LoggedInShell'

// "Pages"
import { NotFoundContainer } from './error/notFound/NotFound'
import { LoginContainer } from './auth/login/Login'
import { DashboardContainer } from './dashboard/dashboard/Dashboard'
import { Inventory } from './dashboard/inventory/Inventory'
import { Maintenance } from './dashboard/maintenance/Maintenance'
import { DeviceListContainer } from './device/list/DeviceList'
import { DeviceDetailContainer } from './device/detail/DeviceDetail'
import { SiteListContainer } from './site/list/SiteList'
import { SiteDetailContainer } from './site/detail/SiteDetail'
import { PersonListContainer } from './person/list/PersonList'
import { ResultListContainer } from './result/list/ResultList'
import { NotificationList } from './components/pages/notification/NotificationList'
import { ReportList } from './components/pages/report/ReportList'

import { refreshStart } from './auth/AuthRedux'

import { hasBlankOrExpiredJWT, getRefreshToken } from './shared/utils/localStorage'

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

// set up analytics
const piwik = config.piwik ? PiwikReactRouter({
  url : config.piwik.url,
  siteId : config.piwik.siteId
}) : false

const routes =
  <Router history={piwik ?  piwik.connectToHistory(history) : history} render={applyRouterMiddleware(useScroll()) }>
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

        <Route path="result">
          <IndexRoute component={ResultListContainer} />
        </Route>

        <Route path="site">
          <IndexRoute component={SiteListContainer} />
          <Route path=":siteId" component={SiteDetailContainer} />
        </Route>

        <Route path="/person" component={PersonListContainer} />

        <Route path="/notification" component={NotificationList} />

        <Route path="/report" component={ReportList} />

      </Route>
      <Route path="*" component={NotFoundContainer} />
    </Route>
  </Router>

class Routes extends Component {

  render() {
    return (
      routes
    )
  }
}

export default Routes
