import React, { useEffect, useState } from 'react'
import { AppBar, IconButton, MenuItem, Toolbar } from '@mui/material'
import classnames from 'classnames/bind'
import { FaUser } from 'react-icons/fa'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Logo from '../../assets/logo_confluence.png'
import useI18n from '../../hooks/useI18n'
import { userRequestedLogout } from '../../store/AuthRedux'
import { aspectFetch } from '../../utils/utils/fetch'
import IconMenu from '../shared/IconMenu'
import requirePermissions from '../shared/requirePermissions'
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
  const [version, setVersion] = useState({ fetched: false, v: '' })

  useEffect(() => {
    const getVersion = async () => {
      aspectFetch('/version').then(r => setVersion({ fetched: true, v: r.version }))
    }

    if (!version.fetched) {
      getVersion()
    }
  }, [version])

  const Account = requirePermissions({
    permissions: ['account:edit'],
  })(() => <MenuItem onClick={navigateCurrentAccountDetails}>{intl.formatMessage(messages.accountDetails)}</MenuItem>)

  return (
    <AppBar className={cssClasses('AppBar__appBar', 'AppBar__appBar--sm')} color="inherit">
      <Toolbar>
        <IconButton className={cssClasses('AppBar__leftIcon')} aria-label="Logo" onClick={navigateRoot}>
          <img className={cssClasses('ConfluenceIcon')} src={Logo} alt="" />
          {version.v && <span className={cssClasses('version')}>v{version.v}</span>}
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
