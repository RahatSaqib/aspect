import React from 'react'
import { compose } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { NavDrawer } from 'react-toolbox/lib/layout'

import LinkNavigation, { makeThemedLink } from './LinkNavigation'
import UserIcon from './UserIcon'
import { toggleDrawer, closeDrawer } from '../../../auth/AuthRedux'

const enhance = compose(
  connect(
    state => ({
      drawerOpen: state.getIn(['user', 'drawerOpen']),
    }),
    bindActionCreators.bind(null, {
      toggleDrawer,
      closeDrawer,
    })
  )
)

const ConnectedNavDrawer = ({
  history,
  location,

  drawerOpen,
  toggleDrawer,
  closeDrawer,
}) =>
  <NavDrawer active={drawerOpen} onOverlayClick={toggleDrawer}>
    <LinkNavigation
      history={history}
      location={location}
      type="vertical"
      onClick={closeDrawer}
    >
      {makeThemedLink({
        history,
        location,
        href: '/account-details/current',
        label: '',
        icon: <UserIcon />,
      })}
    </LinkNavigation>
  </NavDrawer>

export default enhance(ConnectedNavDrawer)
