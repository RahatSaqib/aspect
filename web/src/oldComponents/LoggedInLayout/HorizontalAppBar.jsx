import React from 'react'
import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import classnames from 'classnames/bind'
import { FaUser } from 'react-icons/fa'
import { connect } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { compose } from 'recompose'
import useI18n from '../../hooks/useI18n'
import PermissionsProvider from '../../providers/PermissionsProvider'
import { userRequestedLogout } from '../../store/AuthRedux'
import IconMenu from '../shared/IconMenu'
import requirePermissions from '../shared/requirePermissions'
import ConfluenceIcon from './ConfluenceIcon'
import styles from './index.css'
import messages from './messages'
import ThemedLink from './ThemedLink'

const cssClasses = classnames.bind(styles)

const enhance = compose(connect(null, { userRequestedLogout }))

const HorizontalAppBar = ({ userRequestedLogout }) => {
  const { formatMessage } = useI18n()
  const navigate = useNavigate()
  const navigateRoot = () => navigate('/')
  const navigateCurrentAccountDetails = () => navigate('/account-details/current')

  const rawLinks = [
    { href: '/dashboard', label: formatMessage(messages.homeTitle), permissions: ['dashboard:summary'] },
    { href: '/task-list', label: formatMessage(messages.taskListTitle), permissions: ['taskMenu'] },
    { href: '/operational-data', label: formatMessage(messages.operationDataTitle), permissions: ['operationalData'] },
    { href: '/clinical-indicators', label: formatMessage(messages.clinicalTitle), permissions: ['clinicalIndicators'] },
    {
      label: formatMessage(messages.browseTitle),
      permissions: ['browse'],
      items: [
        { href: '/browse/device', label: formatMessage(messages.devices), permissions: ['device'] },
        { href: '/browse/result', label: formatMessage(messages.results), permissions: ['result'] },
        { href: '/browse/person', label: formatMessage(messages.contacts), permissions: ['person'] },
        { href: '/browse/site', label: formatMessage(messages.sites), permissions: ['site'] },
        { href: '/browse/inventory', label: formatMessage(messages.supplies), permissions: ['inventory'] },
        { href: '/browse/router', label: formatMessage(messages.routers), permissions: ['router'] },
        { href: '/browse/reporter', label: formatMessage(messages.reporters), permissions: ['reporter'] },
        { href: '/browse/notification', label: formatMessage(messages.notifications), permissions: ['notification'] },
        { href: '/browse/deviceApiKey', label: formatMessage(messages.deviceApiKey), permissions: ['deviceApiKey'] },
      ],
    },
    { href: '/reports', label: formatMessage(messages.reportsTitle), permissions: ['report'] },
    { href: '/manage', label: formatMessage(messages.manageTitle), permissions: ['manage'] },
  ]

  const Account = requirePermissions({
    permissions: ['account:edit'],
  })(() => <MenuItem onClick={navigateCurrentAccountDetails}>{formatMessage(messages.accountDetails)}</MenuItem>)

  const [anchorEl, setAnchorEl] = React.useState(null)
  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <AppBar className={cssClasses('AppBar__appBar', 'AppBar__appBar--sm')} color="inherit">
      <Toolbar>
        <IconButton className={cssClasses('AppBar__leftIcon')} aria-label="Logo" onClick={navigateRoot}>
          <ConfluenceIcon />
        </IconButton>

        <div className={cssClasses('Navigation', 'Navigation--horizontal')}>
          {rawLinks.map(link =>
            link.href ? (
              <PermissionsProvider permissions={link.permissions} key={link.href}>
                <ThemedLink label={link.label} href={link.href} requiredPermissions={link.permissions} />
              </PermissionsProvider>
            ) : (
              <PermissionsProvider permissions={link.permissions} key={link.label}>
                <ThemedLink label={link.label} onClick={handleClick} />
                <Menu anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                  {link.items.map(childLink => (
                    <PermissionsProvider permissions={childLink.permissions} key={childLink.href}>
                      <MenuItem component={Link} to={childLink.href} onClick={handleClose}>
                        {childLink.label}
                      </MenuItem>
                    </PermissionsProvider>
                  ))}
                </Menu>
              </PermissionsProvider>
            )
          )}
        </div>
        <IconMenu icon={<FaUser className={cssClasses('IconMenu__icon')} />}>
          <Account />
          <MenuItem onClick={userRequestedLogout}>{formatMessage(messages.signOut)}</MenuItem>
        </IconMenu>
      </Toolbar>
    </AppBar>
  )
}

export default enhance(HorizontalAppBar)
