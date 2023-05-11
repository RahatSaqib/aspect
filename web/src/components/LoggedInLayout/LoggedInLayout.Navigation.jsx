import React, { useState } from 'react'
import { Link, Menu } from '@mui/material'
import classnames from 'classnames/bind'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import PermissionChecker from '../PermissionChecker'
import messages from './messages'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

const submenuSelected = (href, location) => location.pathname.startsWith(`${href}/`)
const itemSelected = (href, location) => location.pathname === href

const MainLink = ({ link }) => {
  const location = useLocation()

  return (
    <RouterLink
      className={cssClasses('Link', { Link__active: itemSelected(link.href, location) })}
      to={link.href}
      key={link.href}
    >
      <abbr>{link.label}</abbr>
    </RouterLink>
  )
}

const SubmenuLink = ({ link, closeSubmenu }) => {
  const location = useLocation()

  return (
    <RouterLink
      className={cssClasses('Link', 'SubLink', 'SizedSubLink', { Link__active: itemSelected(link.href, location) })}
      to={link.href}
      onClick={closeSubmenu}
    >
      <abbr>{link.label}</abbr>
    </RouterLink>
  )
}

const Submenu = ({ link, level, setParentAnchorEl }) => {
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const ArrowIcon = className =>
    open ? <MdKeyboardArrowUp className={className} /> : <MdKeyboardArrowDown className={className} />

  const closeSubmenu = () => {
    setAnchorEl(null)
    if (setParentAnchorEl) {
      setParentAnchorEl(null)
    }
  }

  return (
    <>
      <Link
        className={cssClasses('Link', { SubLink: level !== 0 }, { Link__active: submenuSelected(link.href, location) })}
        aria-controls={open ? 'submenu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={event => setAnchorEl(event.currentTarget)}
      >
        <abbr>
          {link.label} <ArrowIcon className={cssClasses('Caret')} />
        </abbr>
      </Link>
      <Menu id="submenu" anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {link.submenu.map(sl => (
          <PermissionChecker permissions={sl.perm} key={sl.href}>
            {sl.submenu ? (
              <Submenu link={sl} level={level + 1} setParentAnchorEl={setAnchorEl} />
            ) : (
              <SubmenuLink link={sl} closeSubmenu={closeSubmenu} />
            )}
          </PermissionChecker>
        ))}
      </Menu>
    </>
  )
}

const getRawLinks = f => [
  { href: '/dashboard', label: f(messages.homeTitle), perm: ['dashboard:summary'] },
  { href: '/operational-data', label: f(messages.operationDataTitle), perm: ['operationalData'] },
  { href: '/clinical-indicators', label: f(messages.clinicalIndicatorsTitle), perm: ['clinicalIndicators'] },
  {
    href: '/browse/device',
    label: f(messages.devices),
    perm: ['browse', 'device'],
    submenu: [
      { href: '/browse/device/list', label: f(messages.devicesList), perm: ['device'] },
      { href: '/browse/device/workload', label: f(messages.devicesWorkload), perm: ['device'] },
    ],
  },
  { href: '/browse/result', label: f(messages.results), perm: ['browse', 'result'] },
  { href: '/browse/person', label: f(messages.contacts), perm: ['browse', 'person'] },
  { href: '/browse/site', label: f(messages.sites), perm: ['browse', 'site'] },
  {
    href: '/browse/inventory',
    label: f(messages.supplies),
    perm: ['browse', 'inventory'],
    submenu: [
      { href: '/browse/inventory/supplies', label: f(messages.inventoryItems), perm: ['inventory'] },
      { href: '/browse/inventory/log', label: f(messages.inventoryLog), perm: ['inventory'] },
      { href: '/browse/inventory/transfers', label: f(messages.inventoryTransfers), perm: ['inventory'] },
    ],
  },
  { href: '/browse/router', label: f(messages.routers), perm: ['browse', 'router'] },
  { href: '/browse/reporter', label: f(messages.reporters), perm: ['browse', 'reporter'] },
  { href: '/browse/notification', label: f(messages.notifications), perm: ['browse', 'notification'] },
  { href: '/browse/deviceApiKey', label: f(messages.deviceApiKey), perm: ['browse', 'deviceApiKey'] },
  { href: '/reports', label: f(messages.reportsTitle), perm: ['report'] },
  { href: '/manage', label: f(messages.manageTitle), perm: ['manage'] },
]

export const NavigationMenu = () => {
  const { formatMessage } = useI18n()

  const rawLinks = getRawLinks(formatMessage)

  return (
    <nav className={cssClasses('Navigation', 'Navigation--horizontal')}>
      {rawLinks.map(link => (
        <PermissionChecker permissions={link.perm} key={link.href}>
          {link.submenu ? <Submenu link={link} level={0} /> : <MainLink link={link} />}
        </PermissionChecker>
      ))}
    </nav>
  )
}

export default NavigationMenu
