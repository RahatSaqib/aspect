import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import AppBar from 'react-toolbox/lib/app_bar'
import MenuItem from '@material-ui/core/MenuItem'

import FaUser from 'react-icons/lib/fa/user'

import ConfluenceIcon from './ConfluenceIcon'
import LinkNavigation from './LinkNavigation'
import { closeDrawer, userRequestedLogout } from '../../../auth/AuthRedux'
import { isEnabledFeature } from '../../../components/shared/requirePermissions'
import IconMenu from '../../../components/shared/IconMenu'

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
    <IconMenu icon={<FaUser className={cssClasses('IconMenu__icon')} />}>
      {isEnabledFeature(userFeatures, ['account']) && (
        <MenuItem onClick={navigateCurrentAccountDetails}>
          Account Details
        </MenuItem>
      )}
      <MenuItem onClick={userRequestedLogout}>Sign out</MenuItem>
    </IconMenu>
  </AppBar>
)

export default enhance(HorizontalAppBar)
