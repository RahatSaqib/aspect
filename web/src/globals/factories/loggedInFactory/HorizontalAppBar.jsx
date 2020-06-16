import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import MenuItem from '@material-ui/core/MenuItem'

import { FaUser } from 'react-icons/fa'

import ConfluenceIcon from './ConfluenceIcon'
import LinkNavigation from './LinkNavigation'
import { closeDrawer, userRequestedLogout } from '../../../auth/AuthRedux'
import requirePermissions from '../../../components/shared/requirePermissions'
import IconMenu from '../../../components/shared/IconMenu'

const cssClasses = classnames.bind(require('./index.css'))

const enhance = compose(
  withHandlers({
    navigateRoot: ({ history }) => () => history.push('/'),

    navigateCurrentAccountDetails: ({ history }) => () =>
      history.push('/account-details/current'),
  }),
  connect(
    null,
    bindActionCreators.bind(null, {
      closeDrawer,
      userRequestedLogout,
    })
  )
)

const HorizontalAppBar = ({
  history,
  location,

  navigateRoot,
  closeDrawer,
  navigateCurrentAccountDetails,
  userRequestedLogout,
}) => {
  const Account = requirePermissions({
    permissions: ['account:view', 'account:admin', 'account:edit'],
  })(() => (
    <MenuItem onClick={navigateCurrentAccountDetails}>Account Details</MenuItem>
  ))
  return (
    <AppBar className={cssClasses('AppBar__appBar', 'AppBar__appBar--sm')}>
      <Toolbar>
        <IconButton
          className={cssClasses('AppBar__leftIcon')}
          aria-label="Logo"
          onClick={navigateRoot}
        >
          <ConfluenceIcon />
        </IconButton>

        <LinkNavigation
          history={history}
          location={location}
          type="horizontal"
          onClick={closeDrawer}
        />
        <IconMenu icon={<FaUser className={cssClasses('IconMenu__icon')} />}>
          <Account />
          <MenuItem onClick={userRequestedLogout}>Sign out</MenuItem>
        </IconMenu>
      </Toolbar>
    </AppBar>
  )
}

export default enhance(HorizontalAppBar)
