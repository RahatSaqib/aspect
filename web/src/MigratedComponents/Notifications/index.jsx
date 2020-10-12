import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'

import NotificationList from './List'
// import NotificationDetailView from '../../notification/detail/view/NotificationDetailView'
// import NotificationDetailHistory from './Detail'

const AspectNotificationDetails = ({ match }) => {
  console.log(match)

  return (
    <div>
      <Switch>
        <Route exact path={match?.path} render={() => <NotificationList />} />
        {/* <Route
          exact
          path={match?.path}
          render={props => <NotificationDetailView intl={intl} {...props} />}
        />
        <Route
          exact
          path={`${match?.path}/history`}
          render={({ location, history }) => (
            <NotificationDetailHistory location={location} history={history} />
          )}
        /> */}
      </Switch>
    </div>
  )
}

AspectNotificationDetails.propTypes = {
  match: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default AspectNotificationDetails
