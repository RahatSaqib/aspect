import React from 'react'
import { AppBar, IconButton, MenuItem, Toolbar } from '@mui/material'
import classnames from 'classnames/bind'
import { FaUser } from 'react-icons/fa'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import { userRequestedLogout } from '../../store/AuthRedux'
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

const HorizontalAppBar = ({ userRequestedLogout }) => {
  const intl = useI18n()
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

        <LinkNavigation type="horizontal" onClick={() => {}} />
        <IconMenu icon={<FaUser className={cssClasses('IconMenu__icon')} />}>
          <Account />
          <MenuItem onClick={userRequestedLogout}>{intl.formatMessage(messages.signOut)}</MenuItem>
        </IconMenu>
      </Toolbar>
    </AppBar>
  )
}

export default connect(null, { userRequestedLogout })(HorizontalAppBar)
