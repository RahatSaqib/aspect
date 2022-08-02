import React from 'react'
import { compose } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Drawer from '@material-ui/core/Drawer'

import LinkNavigation from './LinkNavigation'
import ThemedLink from './ThemedLink'
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

const ConnectedNavDrawer = ({ navigate, location, drawerOpen, toggleDrawer, closeDrawer }) => (
  <Drawer open={drawerOpen} onClose={toggleDrawer}>
    <LinkNavigation navigate={navigate} location={location} type="vertical" onClick={closeDrawer}>
      <ThemedLink href="/account-details/current" label="Account" navigate={navigate} location={location} />
    </LinkNavigation>
  </Drawer>
)

export default enhance(ConnectedNavDrawer)
