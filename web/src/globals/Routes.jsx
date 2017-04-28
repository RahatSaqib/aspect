import React from 'react'
import { Router } from 'react-router'
import { Switch, Route } from 'react-router-dom'

import history from '../history'

// "Layouts"
import PlainLayout from './layouts/PlainLayout'
import LoggedInLayout from './layouts/LoggedInLayout'

// "Pages"
import Index from './components/Index'
import NotFound from '../error/notFound/NotFound'
import Login from '../auth/login/Login'
import ResetPassword from '../auth/resetPassword/ResetPassword'
import LoadableDashboard from '../dashboard/dashboard/LoadableDashboard'
import PatientCare from '../dashboard/patient-care/PatientCare'
import ManageDevices from '../dashboard/manage-devices/ManageDevices'
import ManageSupplies from '../dashboard/manage-supplies/ManageSupplies'
import Maintenance from '../dashboard/maintenance/Maintenance'
import DeviceDemo from '../demo/device/DeviceDemo'
import DeviceList from '../device/list/DeviceList'
import DeviceDetail from '../device/detail/DeviceDetail'
import DeviceApiKeyList from '../deviceApiKey/list/DeviceApiKeyList'
import SiteList from '../site/list/SiteList'
import SiteDetail from '../site/detail/SiteDetail'
import PersonList from '../person/list/PersonList'
import PersonDetail from '../person/detail/PersonDetail'
import ResultList from '../result/list/ResultList'
import ResultDetail from '../result/detail/ResultDetail'
import NotificationList from '../notification/list/NotificationList'
import ReportList from '../report/list/ReportList'
import AccountDetails from '../account/detail/AccountDetails'
import StyleguideMain from '../styleguide/main/StyleguideMain'
import InventoryItemsList from '../inventory/list/InventoryItemsList'
import RouterList from '../router/list/RouterList'
import RouterDetail from '../router/detail/RouterDetail'
import TerminalList from '../terminal/list/TerminalList'
import TerminalDetail from '../terminal/detail/TerminalDetail'

const Routes = () => (
  <Router history={history}>
    <Switch>
      <Route exact path="/" component={Index} />

      <PlainLayout path="/login" component={Login} />
      <PlainLayout path="/reset-password" component={ResetPassword} />

      <LoggedInLayout exact path="/dashboard" component={LoadableDashboard} />
      <LoggedInLayout path="/dashboard/patient-care" component={PatientCare} />
      <LoggedInLayout path="/dashboard/manage-devices" component={ManageDevices} />
      <LoggedInLayout path="/dashboard/manage-supplies" component={ManageSupplies} />
      <LoggedInLayout path="/dashboard/maintenance" component={Maintenance} />

      <LoggedInLayout path="/demo/device/:deviceId" component={DeviceDemo} />

      <LoggedInLayout exact path="/device" component={DeviceList} />
      <LoggedInLayout path="/device/:deviceId" component={DeviceDetail} />

      <LoggedInLayout exact path="/deviceApiKey" component={DeviceApiKeyList} />

      <LoggedInLayout exact path="/router" component={RouterList} />
      <LoggedInLayout path="/router/:routerId" component={RouterDetail} />

      <LoggedInLayout exact path="/terminal" component={TerminalList} />
      <LoggedInLayout path="/terminal/:terminalId" component={TerminalDetail} />

      <LoggedInLayout exact path="/result" component={ResultList} />
      <LoggedInLayout path="/result/:resultId" component={ResultDetail} />

      <LoggedInLayout exact path="/site" component={SiteList} />
      <LoggedInLayout path="/site/:siteId" component={SiteDetail} />

      <LoggedInLayout exact path="/person" component={PersonList} />
      <LoggedInLayout path="/person/:personId" component={PersonDetail} />

      <LoggedInLayout path="/account-details/current" component={AccountDetails} />

      <LoggedInLayout exact path="/inventory" component={InventoryItemsList} />

      <LoggedInLayout exact path="/notification" component={NotificationList} />

      <LoggedInLayout exact path="/report" component={ReportList} />

      {process.env.NODE_ENV !== 'production' && (
        <PlainLayout path="/styleguide" component={StyleguideMain} />
      )}

      <PlainLayout component={NotFound} />
    </Switch>
  </Router>
)

export default Routes
