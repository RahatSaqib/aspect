import React from 'react'
import { compose, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Switch, Route } from 'react-router-dom'
import NotificationDetailView from './view/NotificationDetailView'
import NotificationDetailHistory from './history/NotificationDetailHistory'
import requirePermissions from '../../components/shared/requirePermissions'
import NotFound from '../../error/notFound/NotFound'

const enhance = compose(
  requirePermissions({
    features: ['notificationDetail:true'],
    ForbiddenComponent: NotFound,
  }),
  connect(
    state => ({
      items: state.notification.items,
      table: state.notification.table,
    }),
    bindActionCreators.bind(null, {})
  ),
  withHandlers({
    onInitialLoad: () => () => {},
  }),
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const NotificationDetail = ({
  intl,
  match,
  // --- injected by recompose ---
}) => (
  <div>
    <Switch>
      <Route
        exact
        path={match.path}
        render={props => <NotificationDetailView intl={intl} {...props} />}
      />
      <Route
        exact
        path={`${match.path}/history`}
        render={props => <NotificationDetailHistory intl={intl} {...props} />}
      />
      />
    </Switch>
  </div>
)

export default enhance(NotificationDetail)
