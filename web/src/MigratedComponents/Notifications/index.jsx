import React from 'react'
import { Switch, Route } from 'react-router-dom'
import PropTypes from 'prop-types'

import NotificationDetailView from '../../notification/detail/view/NotificationDetailView'
import NotificationDetailHistory from './Detail'
import NotificationList from './List'

const AspectNotificationDetails = ({ match }) => {
  return (
    <div>
      <Switch>
        <Route exact path={match?.path} render={() => <NotificationList />} />
        <Route
          exact
          path={`${match?.path}/:notificationId`}
          render={props => <NotificationDetailView {...props} />}
        />
        <Route
          exact
          path={`${match?.path}/:notificationId/history`}
          render={({ location, history }) => (
            <NotificationDetailHistory location={location} history={history} />
          )}
        />
      </Switch>
    </div>
  )
}

AspectNotificationDetails.propTypes = {
  match: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectNotificationDetails
