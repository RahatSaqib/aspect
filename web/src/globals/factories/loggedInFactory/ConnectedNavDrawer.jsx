import React from 'react'
import { compose } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Drawer from '@material-ui/core/Drawer'
import FaUser from 'react-icons/lib/fa/user'

import LinkNavigation, { makeThemedLink } from './LinkNavigation'
import { toggleDrawer, closeDrawer } from '../../../auth/AuthRedux'

const enhance = compose(
  connect(
    state => ({
      drawerOpen: state.user.drawerOpen,
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
}) => (
  <Drawer open={drawerOpen} onClose={toggleDrawer}>
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
        icon: <FaUser />,
      })}
    </LinkNavigation>
  </Drawer>
)

export default enhance(ConnectedNavDrawer)
