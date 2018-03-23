import window from 'global/window'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import AppBar from 'react-toolbox/lib/app_bar'
import { IconMenu, MenuItem, MenuDivider } from 'react-toolbox/lib/menu'
import FaUser from 'react-icons/lib/fa/user'

import ConfluenceIcon from './ConfluenceIcon'
import LinkNavigation from './LinkNavigation'
import { closeDrawer, userRequestedLogout } from '../../../auth/AuthRedux'
import { isEnabledFeature } from '../../../components/shared/requirePermissions'

const cssClasses = classnames.bind(require('./index.css'))

const enhance = compose(
  withHandlers({
    navigateRoot: ({ history }) => () => history.push('/'),

    goToExternalHelp: () => () => {
      window.location.href = 'https://admin.gxalert.com'
    },

    navigateCurrentAccountDetails: ({ history }) => () =>
      history.push('/account-details/current'),
  }),
  connect(
    state => ({ userFeatures: state.user.jwt.features }),
    bindActionCreators.bind(null, {
      closeDrawer,
      userRequestedLogout,
    })
  )
)

const themes = {
  AppBar: {
    appBar: cssClasses('AppBar__appBar', 'AppBar__appBar--sm'),
    leftIcon: cssClasses('AppBar__leftIcon'),
  },
  IconMenu: { icon: cssClasses('IconMenu__icon') },
}

const HorizontalAppBar = ({
  history,
  location,

  navigateRoot,
  closeDrawer,
  goToExternalHelp,
  navigateCurrentAccountDetails,
  userRequestedLogout,
  userFeatures,
}) => (
  <AppBar
    leftIcon={<ConfluenceIcon />}
    onLeftIconClick={navigateRoot}
    theme={themes.AppBar}
  >
    <LinkNavigation
      history={history}
      location={location}
      type="horizontal"
      onClick={closeDrawer}
    />
    <IconMenu
      icon={<FaUser />}
      theme={themes.IconMenu}
      position="topRight"
      menuRipple
    >
      <MenuItem caption="Help" onClick={goToExternalHelp} />
      {isEnabledFeature(userFeatures, ['accountDetails:true']) && (
        <MenuItem
          caption="Account Details"
          onClick={navigateCurrentAccountDetails}
        />
      )}
      <MenuDivider />
      <MenuItem caption="Sign out" onClick={userRequestedLogout} />
    </IconMenu>
  </AppBar>
)

export default enhance(HorizontalAppBar)
