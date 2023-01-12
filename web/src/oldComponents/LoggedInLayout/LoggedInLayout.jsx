import React, { useEffect, useState } from 'react'
import { AppBar, IconButton, MenuItem, Toolbar } from '@mui/material'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { FaUser } from 'react-icons/fa'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Logo from '../../assets/logo_confluence.png'
import useI18n from '../../hooks/useI18n'
import PermissionsProvider from '../../providers/PermissionsProvider'
import { userRequestedLogout } from '../../store/AuthRedux'
import { aspectFetch } from '../../utils/utils/fetch'
import AppNotificationDialog from '../appNotification/AppNotificationDialog'
import AppNotificationSnackBar from '../appNotification/AppNotificationSnackBar'
import IconMenu from '../shared/IconMenu'
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

export const LoggedInLayout = ({ children, userRequestedLogout }) => {
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
    <div classnames={cssClasses('Layout')}>
      <div className={cssClasses('Panel')}>
        <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <AppBar className={cssClasses('AppBar__appBar', 'AppBar__appBar--sm')} color="inherit">
          <Toolbar>
            <IconButton className={cssClasses('AppBar__leftIcon')} aria-label="Logo" onClick={() => navigate('/')}>
              <img className={cssClasses('ConfluenceIcon')} src={Logo} alt="" />
              {!!version?.v && <span className={cssClasses('version')}>v{version.v}</span>}
            </IconButton>

            <LayoutNavigation />

            <IconMenu icon={<FaUser className={cssClasses('IconMenu__icon')} />}>
              <PermissionsProvider permissions={['account:edit']}>
                <MenuItem onClick={() => navigate('/account-details/current')}>
                  {intl.formatMessage(messages.accountDetails)}
                </MenuItem>
              </PermissionsProvider>
              <MenuItem onClick={userRequestedLogout}>{intl.formatMessage(messages.signOut)}</MenuItem>
            </IconMenu>
          </Toolbar>
        </AppBar>
        <div className={cssClasses('Page-Content')}>{children}</div>
        <AppNotificationDialog intl={intl} />
        <AppNotificationSnackBar intl={intl} />
      </div>
    </div>
  )
}

export default connect(null, { userRequestedLogout })(LoggedInLayout)
