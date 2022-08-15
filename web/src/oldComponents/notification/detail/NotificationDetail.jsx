import React from 'react'
import { compose, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Routes, Route } from 'react-router-dom'
import NotificationDetailView from './view/NotificationDetailView'
import NotificationDetailHistory from './history/NotificationDetailHistory'

const enhance = compose(
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

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const NotificationDetail = props => (
  <div>
    <Routes>
      <Route path="">
        <NotificationDetailView {...props} />
      </Route>
      <Route path="history">
        <NotificationDetailHistory {...props} />
      </Route>
    </Routes>
  </div>
)

export default enhance(NotificationDetail)
