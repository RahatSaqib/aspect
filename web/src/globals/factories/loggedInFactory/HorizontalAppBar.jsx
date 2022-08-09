import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages, injectIntl } from 'react-intl'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import { useNavigate } from 'react-router-dom'

import { FaUser } from 'react-icons/fa'

import ConfluenceIcon from './ConfluenceIcon'
import LinkNavigation from './LinkNavigation'
import { closeDrawer, userRequestedLogout } from '../../../auth/AuthRedux'
import requirePermissions from '../../../components/shared/requirePermissions'
import IconMenu from '../../../components/shared/IconMenu'

import styles from './index.css'

const messages = defineMessages({
  accountDetails: {
    id: 'pages.HorizontalAppBar.accountDetails',
    defaultMessage: 'Account Details',
  },
  signOut: {
    id: 'pages.HorizontalAppBar.signOut',
    defaultMessage: 'Sign Out',
  },
})

const cssClasses = classnames.bind(styles)

const enhance = compose(
  injectIntl,
  connect(null, {
    closeDrawer,
    userRequestedLogout,
  })
)

const HorizontalAppBar = ({ closeDrawer, userRequestedLogout, intl }) => {
  const navigate = useNavigate()
  const navigateRoot = () => navigate('/')
  const navigateCurrentAccountDetails = () => navigate('/account-details/current')

  const Account = requirePermissions({
    permissions: ['account:edit'],
  })(() => <MenuItem onClick={navigateCurrentAccountDetails}>{intl.formatMessage(messages.accountDetails)}</MenuItem>)
  return (
    <AppBar className={cssClasses('AppBar__appBar', 'AppBar__appBar--sm')} color="inherit">
      <Toolbar>
        <IconButton className={cssClasses('AppBar__leftIcon')} aria-label="Logo" onClick={navigateRoot}>
          <ConfluenceIcon />
        </IconButton>

        <LinkNavigation type="horizontal" onClick={closeDrawer} />
        <IconMenu icon={<FaUser className={cssClasses('IconMenu__icon')} />}>
          <Account />
          <MenuItem onClick={userRequestedLogout}>{intl.formatMessage(messages.signOut)}</MenuItem>
        </IconMenu>
      </Toolbar>
    </AppBar>
  )
}

export default enhance(HorizontalAppBar)
