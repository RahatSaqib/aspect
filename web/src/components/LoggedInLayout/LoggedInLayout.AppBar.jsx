import React, { useEffect, useState } from 'react'
import { AppBar, Box, Drawer, IconButton, MenuItem, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import { FaUser } from 'react-icons/fa'
import { MdMenu } from 'react-icons/md'
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)
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
        {isMobile && (
          <IconButton
            className={styles.AppBar__leftIcon}
            aria-label={intl.formatMessage(messages.openNavigation)}
            onClick={() => setDrawerOpen(true)}
          >
            <MdMenu />
          </IconButton>
        )}

        <IconButton className={styles.AppBar__leftIcon} aria-label="Logo" onClick={() => navigate('/')}>
          <img className={styles.ConfluenceIcon} src={Logo} alt="" />
          {!!version?.v && <span className={styles.version}>v{version.v}</span>}
        </IconButton>

        {isMobile ? <Box sx={{ flexGrow: 1 }} /> : <LayoutNavigation />}

        <IconMenu icon={<FaUser className={styles.IconMenu__icon} />}>
          <PermissionChecker permissions={['account:edit']}>
            <MenuItem onClick={() => navigate('/account-details/current')}>
              {intl.formatMessage(messages.accountDetails)}
            </MenuItem>
          </PermissionChecker>
          <MenuItem onClick={() => dispatch(userRequestedLogout())}>{intl.formatMessage(messages.signOut)}</MenuItem>
        </IconMenu>
      </Toolbar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box className={styles.Drawer} role="presentation">
          <LayoutNavigation variant="vertical" onNavigate={() => setDrawerOpen(false)} />
        </Box>
      </Drawer>
    </AppBar>
  )
}

export default Header
