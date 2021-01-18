import React from 'react'
import { Switch, Route, useRouteMatch } from 'react-router-dom'

import NotificationDetailView from '../../notification/detail/view/NotificationDetailView'
import NotificationDetailHistory from './Detail/NotificationDetailHistory'
import NotificationList from './List'

const AspectNotificationDetails = () => {
  const { path } = useRouteMatch()
  return (
    <div>
      <Switch>
        <Route
          exact
          path={path}
          permissions={['browse', 'notification']}
          render={() => <NotificationList />}
        />
        <Route
          exact
          path={`${path}/:notificationId`}
          permissions={['browse', 'notification:edit']}
          render={props => <NotificationDetailView {...props} />}
        />
        <Route
          exact
          path={`${path}/:notificationId/history`}
          permissions={['browse', 'notification']}
          render={() => <NotificationDetailHistory />}
        />
      </Switch>
    </div>
  )
}

export default AspectNotificationDetails
