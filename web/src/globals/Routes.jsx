import React from 'react'
import { Router, Switch, Route, Redirect } from 'react-router-dom'
import Paper from 'material-ui/Paper'

import history from '../history'

// "Layouts"
import PlainLayout from './layouts/PlainLayout'
import LoggedInLayout from './layouts/LoggedInLayout'

// "Pages"
import Index from './components/Index'
import NotFound from '../error/notFound/NotFound'
import LoadableLogin from '../auth/login/LoadableLogin'
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

import styles from '../components/shared/Shared.css'

const makeNotImplementedComponent = name => () =>
  <div className={styles.Content}>
    <Paper className={styles.Content}>
      {name} is not implemented yet
    </Paper>
  </div>

const Routes = () =>
  <Router history={history}>
    <Switch>
      <Route exact path="/" component={Index} />

      <PlainLayout path="/login" component={LoadableLogin} />
      <PlainLayout path="/reset-password" component={ResetPassword} />

      <LoggedInLayout exact path="/dashboard" component={LoadableDashboard} />
      <LoggedInLayout path="/dashboard/patient-care" component={PatientCare} />
      <LoggedInLayout
        path="/dashboard/manage-devices"
        component={ManageDevices}
      />
      <LoggedInLayout
        path="/dashboard/manage-supplies"
        component={ManageSupplies}
      />
      <LoggedInLayout path="/dashboard/maintenance" component={Maintenance} />

      <LoggedInLayout
        path="/account-details/current"
        component={AccountDetails}
      />

      <LoggedInLayout path="/demo/device/:deviceId" component={DeviceDemo} />

      {/* TODO: real components */}
      <LoggedInLayout
        path="/task-list"
        component={makeNotImplementedComponent('Task List')}
      />
      <LoggedInLayout
        path="/operational-data"
        component={makeNotImplementedComponent('Operational Data')}
      />
      <LoggedInLayout
        path="/clinical-indicators"
        component={makeNotImplementedComponent('Clinical Indicators')}
      />
      <LoggedInLayout
        path="/reports"
        component={makeNotImplementedComponent('Reports')}
      />
      <LoggedInLayout
        path="/manage"
        component={makeNotImplementedComponent('Manage')}
      />
      {/* END-TODO: real components */}

      <Redirect exact path="/browse" to="/browse/device" />

      <LoggedInLayout exact path="/browse/device" component={DeviceList} />
      <LoggedInLayout
        path="/browse/device/:deviceId"
        component={DeviceDetail}
      />

      <LoggedInLayout
        exact
        path="/browse/deviceApiKey"
        component={DeviceApiKeyList}
      />

      <LoggedInLayout exact path="/browse/router" component={RouterList} />
      <LoggedInLayout
        path="/browse/router/:routerId"
        component={RouterDetail}
      />

      <LoggedInLayout exact path="/browse/terminal" component={TerminalList} />
      <LoggedInLayout
        path="/browse/terminal/:terminalId"
        component={TerminalDetail}
      />

      <LoggedInLayout exact path="/browse/result" component={ResultList} />
      <LoggedInLayout
        path="/browse/result/:resultId"
        component={ResultDetail}
      />

      <LoggedInLayout exact path="/browse/site" component={SiteList} />
      <LoggedInLayout path="/browse/site/:siteId" component={SiteDetail} />

      <LoggedInLayout exact path="/browse/person" component={PersonList} />
      <LoggedInLayout
        path="/browse/person/:personId"
        component={PersonDetail}
      />

      <LoggedInLayout
        exact
        path="/browse/inventory"
        component={InventoryItemsList}
      />

      <LoggedInLayout
        exact
        path="/browse/notification"
        component={NotificationList}
      />

      <LoggedInLayout exact path="/browse/report" component={ReportList} />

      {process.env.NODE_ENV !== 'production' &&
        <PlainLayout path="/styleguide" component={StyleguideMain} />}

      <PlainLayout component={NotFound} />
    </Switch>
  </Router>

export default Routes
