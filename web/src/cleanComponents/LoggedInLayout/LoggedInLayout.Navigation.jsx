import React, { useState } from 'react'
import { Link, Menu } from '@mui/material'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import { useIntl } from 'react-intl'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import PermissionChecker from '../../components/PermissionChecker'
import messages from '../../messages/allMessages'
import styles from './styles.module.css'

const submenuSelected = (href, location) => location.pathname.startsWith(`${href}/`)
const itemSelected = (href, location) => location.pathname === href

const MainLink = ({ link }) => {
  const location = useLocation()
  const classes = `${styles.Link} ${itemSelected(link.href, location) ? styles.Link__active : ''}`

  return (
    <RouterLink className={classes} to={link.href} key={link.href}>
      <abbr>{link.label}</abbr>
    </RouterLink>
  )
}

const SubmenuLink = ({ link, closeSubmenu }) => {
  const location = useLocation()

  const classes = `${styles.Link} ${styles.SubLink} ${styles.SizedSubLink} ${
    itemSelected(link.href, location) ? styles.Link__active : ''
  }`

  return (
    <RouterLink className={classes} to={link.href} onClick={closeSubmenu}>
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

  const classes = `${styles.Link} ${level !== 0 ? styles.SubLink : ''} ${
    submenuSelected(link.href, location) ? styles.Link__active : ''
  }`

  return (
    <>
      <Link
        className={classes}
        aria-controls={open ? 'submenu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={event => setAnchorEl(event.currentTarget)}
      >
        <abbr>
          {link.label} <ArrowIcon className={styles.Caret} />
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
  { href: '/dashboard-v2', label: f(messages.dashboardV2Title), perm: ['dashboard:summary', '+dashboard-v2:view'] },
  { href: '/operational-data', label: f(messages.operationDataTitle), perm: ['operationalData'] },
  { href: '/clinical-indicators', label: f(messages.clinicalIndicatorsTitle), perm: ['clinicalIndicators'] },
  {
    href: '/browse/device',
    label: f(messages.devices),
    perm: ['browse', '+device'],
    submenu: [
      { href: '/browse/device/list', label: f(messages.devicesList), perm: ['device'] },
      { href: '/browse/device/workload', label: f(messages.devicesWorkload), perm: ['device'] },
    ],
  },
  { href: '/browse/site', label: f(messages.sites), perm: ['browse', '+site'] },
  { href: '/browse/result', label: f(messages.results), perm: ['browse', '+result'] },
  {
    href: '/browse/person',
    label: f(messages.contacts),
    perm: ['browse', '+person'],
  },
  {
    href: '/browse/inventory',
    label: f(messages.supplies),
    perm: ['browse', '+inventory'],
    submenu: [
      { href: '/browse/inventory/supplies', label: f(messages.inventoryItems), perm: ['inventory'] },
      { href: '/browse/inventory/log', label: f(messages.inventoryLog), perm: ['inventory'] },
      { href: '/browse/inventory/transfers', label: f(messages.inventoryTransfers), perm: ['inventory'] },
      { href: '/browse/inventory/overview', label: f(messages.InventoryOverview), perm: ['inventory'] },
    ],
  },
  { href: '/browse/reporter', label: f(messages.reporters), perm: ['browse', '+reporter'] },
  {
    href: '/browse/notification',
    label: f(messages.notifications),
    perm: ['browse', '+notification'],
    submenu: [
      { href: '/browse/notification/types', label: f(messages.notificationTypes), perm: ['notification'] },
      { href: '/browse/notification/logs', label: f(messages.notificationLogs), perm: ['notification'] },
    ],
  },
  { href: '/browse/deviceApiKey', label: f(messages.deviceApiKey), perm: ['browse', '+deviceApiKey'] },
  { href: '/reports', label: f(messages.reportsTitle), perm: ['+report'] },
  { href: '/manage', label: f(messages.manageTitle), perm: ['manage'] },
]

const NavigationMenu = () => {
  const { formatMessage } = useIntl()

  const rawLinks = getRawLinks(formatMessage)

  return (
    <nav className={`${styles.Navigation} ${styles.Navigation__horizontal}`}>
      {rawLinks.map(link => (
        <PermissionChecker permissions={link.perm} key={link.href}>
          {link.submenu ? <Submenu link={link} level={0} /> : <MainLink link={link} />}
        </PermissionChecker>
      ))}
    </nav>
  )
}

export default NavigationMenu
