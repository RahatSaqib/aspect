import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import AppBar from 'react-toolbox/lib/app_bar'
import { IconMenu, MenuItem } from 'react-toolbox/lib/menu'
import FaUser from 'react-icons/lib/fa/user'

import ConfluenceIcon from './ConfluenceIcon'
import LinkNavigation from './LinkNavigation'
import { closeDrawer, userRequestedLogout } from '../../../auth/AuthRedux'
import { isEnabledFeature } from '../../../components/shared/requirePermissions'

const cssClasses = classnames.bind(require('./index.css'))

const enhance = compose(
  withHandlers({
    navigateRoot: ({ history }) => () => history.push('/'),

    navigateCurrentAccountDetails: ({ history }) => () =>
      history.push('/account-details/current'),
  }),
  connect(
    state => ({ userFeatures: state.user.features }),
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
      {isEnabledFeature(userFeatures, ['account']) && (
        <MenuItem
          caption="Account Details"
          onClick={navigateCurrentAccountDetails}
        />
      )}
      <MenuItem caption="Sign out" onClick={userRequestedLogout} />
    </IconMenu>
  </AppBar>
)

export default enhance(HorizontalAppBar)
