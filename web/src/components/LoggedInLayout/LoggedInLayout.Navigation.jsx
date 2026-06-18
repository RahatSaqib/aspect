import React, { useState } from 'react'
import { Collapse, Link, List, Menu } from '@mui/material'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import { useIntl } from 'react-intl'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import useAuthState from '../../hooks/useAuthState'
import { getCustomMessage } from '../../messages'
import messages from '../../messages/allMessages'
import { routePaths } from '../../routes/constants'
import PermissionChecker from '../PermissionChecker'
import styles from './styles.module.css'

const submenuSelected = (href, location) => location.pathname.startsWith(`${href}/`)
const itemSelected = (href, location) => location.pathname === href

const MainLink = ({ link, onNavigate }) => {
  const location = useLocation()
  const classes = `${styles.Link} ${itemSelected(link.href, location) ? styles.Link__active : ''}`

  return (
    <RouterLink className={classes} to={link.href} key={link.href} onClick={onNavigate}>
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

const VerticalSubmenu = ({ link, level, onNavigate }) => {
  const location = useLocation()
  const [open, setOpen] = useState(submenuSelected(link.href, location))

  const ArrowIcon = className =>
    open ? <MdKeyboardArrowUp className={className} /> : <MdKeyboardArrowDown className={className} />

  const classes = `${styles.Link} ${level !== 0 ? styles.SubLink : ''} ${
    submenuSelected(link.href, location) ? styles.Link__active : ''
  }`

  return (
    <>
      <Link
        className={classes}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={() => setOpen(prev => !prev)}
      >
        <abbr>
          {link.label} <ArrowIcon className={styles.Caret} />
        </abbr>
      </Link>
      <Collapse in={open} unmountOnExit>
        <List disablePadding className={styles.VerticalSubmenu}>
          {link.submenu.map(sl => (
            <PermissionChecker permissions={sl.perm} key={sl.href}>
              {sl.submenu ? (
                <VerticalSubmenu link={sl} level={level + 1} onNavigate={onNavigate} />
              ) : (
                <SubmenuLink link={sl} closeSubmenu={onNavigate} />
              )}
            </PermissionChecker>
          ))}
        </List>
      </Collapse>
    </>
  )
}

const getRawLinks = (f, user) => [
  { href: '/dashboard', label: f(messages.homeTitle), perm: ['dashboard:summary'] },
  { href: '/dashboard-v2', label: f(messages.dashboardV2Title), perm: ['dashboard:summary'] },
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
    perm: ['+inventory'],
    submenu: [
      { href: '/browse/inventory/supplies', label: f(messages.inventoryOnHand), perm: ['inventory'] },
      { href: '/browse/inventory/log', label: f(messages.inventoryLog), perm: ['inventory'] },
      { href: '/browse/inventory/transfers', label: f(messages.inventoryTransfers), perm: ['inventory'] },
      { href: '/browse/inventory/overview', label: f(messages.InventoryOverview), perm: ['inventory'] },
      {
        href: '/browse/inventory/reconciliation',
        label: f(messages.inventoryReconciliation),
        perm: ['inventory'],
      },
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
  {
    href: '/browse/forms',
    label: f(messages.forms),
    perm: ['+browse', '+forms', '+result'],
    submenu: [
      {
        href: routePaths.FORMS_TRUENAT_CUSTOM_FIELDS,
        label: f(messages.truenatCustomFields),
        perm: ['+browse', '+forms', '+result'],
      },
    ],
  },
  { href: '/reports', label: f(messages.reportsTitle), perm: ['+report'] },
  { href: '/manage', label: f(messages.manageTitle), perm: ['manage'] },
  {
    href: '/browse/admin',
    label: f(messages.admin),
    perm: ['admin:edit'],
    submenu: [
      { href: '/browse/admin/states', label: getCustomMessage(f, messages, 'state', user), perm: ['admin', 'edit'] },
      { href: '/browse/admin/lgas', label: getCustomMessage(f, messages, 'lga', user), perm: ['admin', 'edit'] },
      {
        href: '/browse/admin/inventory-list',
        label: getCustomMessage(f, messages, 'inventoryItems', user),
        perm: ['admin', 'edit'],
      },
      {
        href: routePaths.ADMIN_INVENTORY_RECONCILIATION_FORM,
        label: getCustomMessage(f, messages, 'inventoryManagementConfiguration', user),
        perm: ['admin', 'edit'],
      },
      { href: '/browse/deviceApiKey', label: f(messages.deviceApiKey), perm: ['browse', '+deviceApiKey'] },
    ],
  },
]

const NavigationMenu = ({ variant = 'horizontal', onNavigate }) => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const rawLinks = getRawLinks(formatMessage, user)
  const isVertical = variant === 'vertical'

  return (
    <nav className={`${styles.Navigation} ${isVertical ? styles.Navigation__vertical : styles.Navigation__horizontal}`}>
      {rawLinks.map(link => (
        <PermissionChecker permissions={link.perm} key={link.href}>
          {link.submenu ? (
            isVertical ? (
              <VerticalSubmenu link={link} level={0} onNavigate={onNavigate} />
            ) : (
              <Submenu link={link} level={0} />
            )
          ) : (
            <MainLink link={link} onNavigate={isVertical ? onNavigate : undefined} />
          )}
        </PermissionChecker>
      ))}
    </nav>
  )
}

export default NavigationMenu
