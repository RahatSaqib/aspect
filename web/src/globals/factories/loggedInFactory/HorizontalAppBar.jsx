import classnames from 'classnames/bind'
import React from 'react'
import { compose } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import AppBar from 'react-toolbox/lib/app_bar'
import { IconMenu, MenuItem, MenuDivider } from 'react-toolbox/lib/menu'
import FaUser from 'react-icons/lib/fa/user'

import ConfluenceIcon from './ConfluenceIcon'
import LinkNavigation from './LinkNavigation'
import {
  navigateRoot,
  closeDrawer,
  goToExternalHelp,
  navigateCurrentAccountDetails,
  logoutStart,
} from '../../../auth/AuthRedux'

const cssClasses = classnames.bind(require('./index.css'))

const enhance = compose(
  connect(
    null,
    bindActionCreators.bind(null, {
      navigateRoot,
      closeDrawer,
      goToExternalHelp,
      navigateCurrentAccountDetails,
      logoutStart,
    })
  )
)

const HorizontalAppBar = ({
  history,
  location,

  navigateRoot,
  closeDrawer,
  goToExternalHelp,
  navigateCurrentAccountDetails,
  logoutStart,
}) =>
  <AppBar
    leftIcon={<ConfluenceIcon />}
    onLeftIconClick={navigateRoot}
    theme={{
      appBar: cssClasses('AppBar__appBar', 'AppBar__appBar--sm'),
      leftIcon: cssClasses('AppBar__leftIcon'),
    }}
  >
    <LinkNavigation
      history={history}
      location={location}
      type="horizontal"
      onClick={closeDrawer}
    />
    <IconMenu
      icon={<FaUser />}
      theme={{ icon: cssClasses('IconMenu__icon') }}
      position="topRight"
      menuRipple
    >
      <MenuItem caption="Help" onClick={goToExternalHelp} />
      <MenuItem
        caption="Account Details"
        onClick={navigateCurrentAccountDetails}
      />
      <MenuDivider />
      <MenuItem caption="Sign out" onClick={logoutStart} />
    </IconMenu>
  </AppBar>

export default enhance(HorizontalAppBar)
