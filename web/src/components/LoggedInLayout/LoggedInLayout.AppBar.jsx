import React, { useEffect, useState } from 'react'
import { AppBar, IconButton, MenuItem, Toolbar } from '@mui/material'
import { FaUser } from 'react-icons/fa'
import { useIntl } from 'react-intl'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Logo from '../../assets/logo_confluence.png'
import messages from '../../messages/allMessages'
import { userRequestedLogout } from '../../store/AuthRedux'
import { aspectFetch } from '../../utils/utils/fetch'
import PermissionChecker from '../PermissionChecker'
import IconMenu from '../shared/IconMenu'
import LayoutNavigation from './LoggedInLayout.Navigation'
import styles from './styles.module.css'

const Header = () => {
  const dispatch = useDispatch()
  const intl = useIntl()
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
        <IconButton className={styles.AppBar__leftIcon} aria-label="Logo" onClick={() => navigate('/')}>
          <img className={styles.ConfluenceIcon} src={Logo} alt="" />
          {!!version?.v && <span className={styles.version}>v{version.v}</span>}
        </IconButton>

        <LayoutNavigation />

        <IconMenu icon={<FaUser className={styles.IconMenu__icon} />}>
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
