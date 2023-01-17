import React, { useState } from 'react'
import { Link, Menu } from '@mui/material'
import classnames from 'classnames/bind'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import PermissionsProvider from '../../providers/PermissionsProvider'
import messages from './messages'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

export const NavigationMenu = () => {
  const { formatMessage: f } = useI18n()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const rawLinks = [
    { href: '/dashboard', label: f(messages.homeTitle), perm: ['dashboard:summary'] },
    { href: '/operational-data', label: f(messages.operationDataTitle), perm: ['operationalData'] },
    { href: '/clinical-indicators', label: f(messages.clinicalIndicatorsTitle), perm: ['clinicalIndicators'] },
    {
      href: '/browse',
      label: f(messages.browseTitle),
      perm: ['browse'],
      submenu: [
        { href: '/browse/device', label: f(messages.devices), perm: ['device'] },
        { href: '/browse/result', label: f(messages.results), perm: ['result'] },
        { href: '/browse/person', label: f(messages.contacts), perm: ['person'] },
        { href: '/browse/site', label: f(messages.sites), perm: ['site'] },
        { href: '/browse/inventory', label: f(messages.supplies), perm: ['inventory'] },
        { href: '/browse/router', label: f(messages.routers), perm: ['router'] },
        { href: '/browse/reporter', label: f(messages.reporters), perm: ['reporter'] },
        { href: '/browse/notification', label: f(messages.notifications), perm: ['notification'] },
        { href: '/browse/deviceApiKey', label: f(messages.deviceApiKey), perm: ['deviceApiKey'] },
      ],
    },
    { href: '/reports', label: f(messages.reportsTitle), perm: ['report'] },
    { href: '/manage', label: f(messages.manageTitle), perm: ['manage'] },
  ]

  const submenuSelected = href => location.pathname.startsWith(href)
  const itemSelected = href => location.pathname === href

  const ArrowIcon = className =>
    open ? <MdKeyboardArrowUp className={className} /> : <MdKeyboardArrowDown className={className} />

  return (
    <nav className={cssClasses('Navigation', 'Navigation--horizontal')}>
      {rawLinks.map(link => (
        <PermissionsProvider permissions={link.perm}>
          {link.submenu ? (
            <>
              <Link
                className={cssClasses('Link', { Link__active: submenuSelected(link.href) })}
                aria-controls={open ? 'submenu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
              >
                <abbr>
                  {link.label} <ArrowIcon className={cssClasses('Caret')} />
                </abbr>
              </Link>
              <Menu id="submenu" anchorEl={anchorEl} open={open} onClose={handleClose}>
                {link.submenu.map(link => (
                  <PermissionsProvider permissions={link.perm}>
                    <RouterLink
                      className={cssClasses('Link', 'SubLink', { Link__active: itemSelected(link.href) })}
                      to={link.href}
                      onClick={handleClose}
                    >
                      <abbr>{link.label}</abbr>
                    </RouterLink>
                  </PermissionsProvider>
                ))}
              </Menu>
            </>
          ) : (
            <RouterLink className={cssClasses('Link', { Link__active: itemSelected(link.href) })} to={link.href}>
              <abbr>{link.label}</abbr>
            </RouterLink>
          )}
        </PermissionsProvider>
      ))}
    </nav>
  )
}

export default NavigationMenu
