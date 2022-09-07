import React from 'react'
import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import classnames from 'classnames/bind'
import { FaUser } from 'react-icons/fa'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { compose } from 'recompose'
import { closeDrawer, userRequestedLogout } from '../../store/AuthRedux'
import IconMenu from '../shared/IconMenu'
import requirePermissions from '../shared/requirePermissions'
import ConfluenceIcon from './ConfluenceIcon'
import styles from './index.css'
import LinkNavigation from './LinkNavigation'

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
