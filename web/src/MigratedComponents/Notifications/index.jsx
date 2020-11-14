import React from 'react'
import { Switch, Route, useParams } from 'react-router-dom'
import PropTypes from 'prop-types'

// import NotificationDetailView from '../../notification/Detail/view/NotificationDetailView'
import NotificationDetailHistory from './Detail/NotificationDetailHistory'
import NotificationList from './List'

const AspectNotificationDetails = ({ match }) => {
  const params = useParams()
  return (
    <div>
      <Switch>
        <Route exact path={match.path} render={() => <NotificationList />} />
        {/* <Route
          exact
          path={`${match?.path}/:notificationId`}
          render={props => <NotificationDetailView {...props} />}
        /> */}
        <Route
          path={`${match.path}/history`}
          render={({ location, history }) => (
            <NotificationDetailHistory
              location={location}
              history={history}
              {...params}
            />
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
