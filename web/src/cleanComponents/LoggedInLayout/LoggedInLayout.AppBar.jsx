import React, { useEffect, useState } from 'react'
import { AppBar, IconButton, MenuItem, Toolbar } from '@mui/material'
import classnames from 'classnames/bind'
import { FaUser } from 'react-icons/fa'
import { defineMessages } from 'react-intl'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Logo from '../../assets/logo_confluence.png'
import PermissionChecker from '../../components/PermissionChecker'
import useI18n from '../../hooks/useI18n'
import IconMenu from '../../oldComponents/shared/IconMenu'
import { userRequestedLogout } from '../../store/AuthRedux'
import { aspectFetch } from '../../utils/utils/fetch'
import LayoutNavigation from './LoggedInLayout.Navigation'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

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

const Header = () => {
  const dispatch = useDispatch()
  const intl = useI18n()
  const navigate = useNavigate()
  const [version, setVersion] = useState({ fetched: false, v: '' })

  useEffect(() => {
    const getVersion = async () => {
      aspectFetch('/version').then(r => setVersion({ fetched: true, v: r.version }))
    }

    if (!version.fetched) {
      getVersion()
    }
  }, [version])

  return (
    <AppBar color="inherit" position="sticky">
      <Toolbar>
        <IconButton className={cssClasses('AppBar__leftIcon')} aria-label="Logo" onClick={() => navigate('/')}>
          <img className={cssClasses('ConfluenceIcon')} src={Logo} alt="" />
          {!!version?.v && <span className={cssClasses('version')}>v{version.v}</span>}
        </IconButton>

        <LayoutNavigation />

        <IconMenu icon={<FaUser className={cssClasses('IconMenu__icon')} />}>
          <PermissionChecker permissions={['account:edit']}>
            <MenuItem onClick={() => navigate('/account-details/current')}>
              {intl.formatMessage(messages.accountDetails)}
            </MenuItem>
          </PermissionChecker>
          <MenuItem onClick={() => dispatch(userRequestedLogout())}>{intl.formatMessage(messages.signOut)}</MenuItem>
        </IconMenu>
      </Toolbar>
    </AppBar>
  )
}

export default Header
