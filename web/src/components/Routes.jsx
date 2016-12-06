import React, { Component } from 'react'
import { Router, Route, IndexRoute, IndexRedirect, applyRouterMiddleware, browserHistory } from 'react-router'
import { useScroll } from 'react-router-scroll'
import PiwikReactRouter from 'piwik-react-router'
import config from 'config'
import store from '../store'

// higher level containers/shells
import App from '../components/layouts/App'
import LoggedInShell from '../components/layouts/LoggedInShell'

// "Pages"
import { NotFoundContainer } from '../error/notFound/NotFound'
import { LoginContainer } from '../auth/login/Login'
import { ResetPasswordContainer } from '../auth/resetPassword/ResetPassword'
import { DashboardContainer } from '../dashboard/dashboard/Dashboard'
import { InventoryContainer } from '../dashboard/inventory/Inventory'
import { MaintenanceContainer } from '../dashboard/maintenance/Maintenance'
import { DeviceListContainer } from '../device/list/DeviceList'
import { DeviceDetailContainer } from '../device/detail/DeviceDetail'
import { SiteListContainer } from '../site/list/SiteList'
import { SiteDetailContainer } from '../site/detail/SiteDetail'
import { PersonListContainer } from '../person/list/PersonList'
import { PersonDetailContainer } from '../person/detail/PersonDetail'
import { ResultListContainer } from '../result/list/ResultList'
import { ResultDetailContainer } from '../result/detail/ResultDetail'
import { NotificationListContainer } from '../notification/list/NotificationList'
import { ReportListContainer } from '../report/list/ReportList'
import { AccountDetailsContainer } from '../account/detail/AccountDetails'
import { StyleguideMainContainer } from '../styleguide/main/StyleguideMain'
import { InventoryItemsListContainer } from '../inventory/list/InventoryItemsList'
import { RouterListContainer } from '../router/list/RouterList'
import { RouterDetailContainer } from '../router/detail/RouterDetail'

import { refreshStart } from '../auth/AuthRedux'

import { hasBlankOrExpiredJWT, getRefreshToken } from '../shared/utils/localStorage'

function requireAuth(nextState, replace) {
  // TODO: check access level based on tokens/roles in jwt
  if (hasBlankOrExpiredJWT()) {
    // try to refresh if we have a refresh token
    // if not, redirect to login
    if (getRefreshToken()) {
      store.dispatch(refreshStart())
    } else {
      replace({
        pathname: '/login',
        state: { nextPathname: nextState.location.pathname }
      })
    }
  }
}

// set up analytics
const piwik = config.piwik ? PiwikReactRouter({ // eslint-disable-line new-cap
  url: config.piwik.url,
  siteId: config.piwik.siteId
}) : false

const routes =
  (<Router
    history={piwik ? piwik.connectToHistory(browserHistory) : browserHistory}
    render={applyRouterMiddleware(useScroll())}
  >
    <Route component={App} path="/">
      <Route component={LoginContainer} path="login" />
      <Route component={ResetPasswordContainer} path="reset-password" />
      <Route
        component={LoggedInShell}
        onEnter={requireAuth}
        onChange={(prevState, nextState, replace) => requireAuth(nextState, replace)}
      >
        <IndexRedirect to="dashboard" />

        <Route path="dashboard" >
          <IndexRoute component={DashboardContainer} />
          <Route path="inventory" component={InventoryContainer} />
          <Route path="maintenance" component={MaintenanceContainer} />
        </Route>

        <Route path="device" deviceConfig={{ filterParams: { hasResults: 1 }, filterConfig: { assayAndResultCategory: true, geography: true, date: true, deviceName: true } }}>
          <IndexRoute component={DeviceListContainer} />
          <Route path=":deviceId" component={DeviceDetailContainer} />
        </Route>

        <Route path="router" routerConfig={{ filterParams: { hasResults: 0, hasConnectivity: 1 }, filterConfig: { geography: true, date: true, deviceName: true } }}>
          <IndexRoute component={RouterListContainer} />
          <Route path=":routerId" component={RouterDetailContainer} />
        </Route>

        <Route path="result">
          <IndexRoute component={ResultListContainer} />
          <Route path=":resultId" component={ResultDetailContainer} />
        </Route>

        <Route path="site">
          <IndexRoute component={SiteListContainer} />
          <Route path=":siteId" component={SiteDetailContainer} />
        </Route>

        <Route path="person">
          <IndexRoute component={PersonListContainer} />
          <Route path=":personId" component={PersonDetailContainer} />
        </Route>

        <Route path="account-details">
          <Route path="current" component={AccountDetailsContainer} />
        </Route>

        <Route path="inventory">
          <IndexRoute component={InventoryItemsListContainer} />
        </Route>

        <Route path="notification" component={NotificationListContainer} />

        <Route path="report" component={ReportListContainer} />

      </Route>
      {process.env.NODE_ENV !== 'production' && (
        <Route path="styleguide" component={StyleguideMainContainer} />
      )}
      <Route path="*" component={NotFoundContainer} />
    </Route>
  </Router>)

class Routes extends Component {
  render() {
    return (
      routes
    )
  }
}

export default Routes
