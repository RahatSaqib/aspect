import React from 'react'
import { Switch, Route, useRouteMatch } from 'react-router-dom'

import NotificationDetailView from '../../notification/Detail/view/NotificationDetailView'
import NotificationDetailHistory from './Detail/NotificationDetailHistory'
import NotificationList from './List'

const AspectNotificationDetails = () => {
  const { path } = useRouteMatch()
  return (
    <div>
      <Switch>
        <Route exact path={path} render={() => <NotificationList />} />
        <Route
          exact
          path={`${path}/:notificationId`}
          render={props => <NotificationDetailView {...props} />}
        />
        <Route
          path={`${path}/:notificationId/history`}
          render={() => <NotificationDetailHistory />}
        />
      </Switch>
    </div>
  )
}

export default AspectNotificationDetails
