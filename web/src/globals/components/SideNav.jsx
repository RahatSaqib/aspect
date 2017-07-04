import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { Link } from 'react-router-dom'

// Material-UI
import Drawer from 'material-ui/Drawer'
import { ListItem } from 'material-ui/List'
import Divider from 'material-ui/Divider'
import Subheader from 'material-ui/Subheader'
import {
  green500,
  red400,
  blue800,
  orange500,
  indigo600,
} from 'material-ui/styles/colors'
import Home from 'material-ui/svg-icons/action/home'
import Favorite from 'material-ui/svg-icons/action/favorite'
import Cart from 'material-ui/svg-icons/action/shopping-cart'
import Build from 'material-ui/svg-icons/action/build'
import Scanner from 'material-ui/svg-icons/hardware/scanner'
import VpnKey from 'material-ui/svg-icons/communication/vpn-key'
import Location from 'material-ui/svg-icons/communication/location-on'
import Assignment from 'material-ui/svg-icons/action/assignment'
import People from 'material-ui/svg-icons/social/people'
import Notifications from 'material-ui/svg-icons/social/notifications'
import Book from 'material-ui/svg-icons/action/book'
import RssFeed from 'material-ui/svg-icons/communication/rss-feed'
import Computer from 'material-ui/svg-icons/hardware/computer'

// Our own imports
import requirePermissions from '../../components/shared/requirePermissions'
import SelectableList from '../../components/shared/SelectableList'
import styles from './SideNav.css'

const cssClasses = classnames.bind(styles)

const DevicesLink = requirePermissions({
  permissions: ['device:admin', 'device:view', 'device:edit'],
})(Link)

const ResultsLink = requirePermissions({
  permissions: ['result:admin', 'result:view', 'result:edit'],
})(Link)

const ContactsLink = requirePermissions({
  permissions: ['person:admin', 'person:view', 'person:edit'],
})(Link)

const SitesLink = requirePermissions({
  permissions: ['site:admin', 'site:view', 'site:edit'],
})(Link)

const InventoryLink = requirePermissions({
  permissions: ['inventory:admin', 'inventory:view', 'inventory:edit'],
})(Link)

const NotificationsLink = requirePermissions({
  permissions: ['notification:admin', 'notification:view', 'notification:edit'],
})(Link)

const ReportsLink = requirePermissions({
  permissions: ['report:admin', 'report:view', 'report:edit'],
})(Link)

const DeviceApiKeysLink = requirePermissions({
  permissions: ['deviceApiKey:admin', 'deviceApiKey:view', 'deviceApiKey:edit'],
})(Link)

const enhance = compose(
  setPropTypes({
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    desktop: PropTypes.bool.isRequired,
  }),
  pure
)

export const SideNav = ({ open, handleClose, pathname, desktop }) =>
  <Drawer
    docked={desktop}
    containerClassName={cssClasses({
      'Drawer--desktop': desktop,
    })}
    open={open}
    onRequestChange={handleClose}
  >
    <SelectableList
      pathname={pathname}
      desktop={desktop}
      handleClose={handleClose}
    >
      <Subheader>Dashboards</Subheader>
      <ListItem
        containerElement={<Link to="/dashboard" />}
        value={'/dashboard'}
        leftIcon={<Home color={green500} />}
        className={styles.Drawer__ListItem}
        primaryText="Overview"
      />
      <ListItem
        containerElement={<Link to="/dashboard/patient-care" />}
        value={'/dashboard/patient-care'}
        leftIcon={<Favorite color={red400} />}
        className={styles.Drawer__ListItem}
        primaryText="Patient Care"
      />
      <ListItem
        containerElement={<Link to="/dashboard/manage-devices" />}
        value={'/dashboard/manage-devices'}
        leftIcon={<Scanner color={blue800} />}
        className={styles.Drawer__ListItem}
        primaryText="Manage Devices"
      />
      <ListItem
        containerElement={<Link to="/dashboard/manage-supplies" />}
        value={'/dashboard/manage-supplies'}
        leftIcon={<Cart color={orange500} />}
        className={styles.Drawer__ListItem}
        primaryText="Manage Supplies"
      />
      <ListItem
        containerElement={<Link to="/dashboard/maintenance" />}
        value={'/dashboard/maintenance'}
        leftIcon={<Build color={indigo600} />}
        className={styles.Drawer__ListItem}
        primaryText="Maintenance"
      />
      <Divider />
      <Subheader>Sections</Subheader>
      <ListItem
        containerElement={<DevicesLink to="/device" />}
        value={'/device'}
        leftIcon={<Scanner />}
        className={styles.Drawer__ListItem}
        primaryText="Devices"
      />
      <ListItem
        containerElement={<ResultsLink to="/result" />}
        value={'/result'}
        leftIcon={<Assignment />}
        className={styles.Drawer__ListItem}
        primaryText="Results"
      />
      <ListItem
        containerElement={<ContactsLink to="/person" />}
        value={'/person'}
        leftIcon={<People />}
        className={styles.Drawer__ListItem}
        primaryText="Contacts"
      />
      <ListItem
        containerElement={<SitesLink to="/site" />}
        value={'/site'}
        leftIcon={<Location />}
        className={styles.Drawer__ListItem}
        primaryText="Sites"
      />
      <ListItem
        containerElement={<InventoryLink to="/inventory" />}
        value={'/inventory'}
        leftIcon={<Cart />}
        className={styles.Drawer__ListItem}
        primaryText="Supplies"
      />
      <ListItem
        containerElement={<DevicesLink to="/router" />}
        value={'/router'}
        leftIcon={<RssFeed />}
        className={styles.Drawer__ListItem}
        primaryText="Routers"
      />
      <ListItem
        containerElement={<DevicesLink to="/terminal" />}
        value={'/terminal'}
        leftIcon={<Computer />}
        className={styles.Drawer__ListItem}
        primaryText="Terminals"
      />
      <ListItem
        containerElement={<NotificationsLink to="/notification" />}
        value={'/notification'}
        leftIcon={<Notifications />}
        className={styles.Drawer__ListItem}
        primaryText="Notifications"
      />
      <ListItem
        containerElement={<ReportsLink to="/report" />}
        value={'/report'}
        leftIcon={<Book />}
        className={styles.Drawer__ListItem}
        primaryText="Reports"
      />
      <ListItem
        containerElement={<DeviceApiKeysLink to="/deviceApiKey" />}
        value={'/deviceApiKey'}
        leftIcon={<VpnKey />}
        className={styles.Drawer__ListItem}
        primaryText="Device API Keys"
      />
    </SelectableList>
  </Drawer>

export default enhance(SideNav)
