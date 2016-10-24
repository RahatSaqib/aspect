// Imports from packages
import classnames from 'classnames/bind'
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'

// Material-UI
import Drawer from 'material-ui/Drawer'
import { ListItem } from 'material-ui/List'
import Divider from 'material-ui/Divider'
import Subheader from 'material-ui/Subheader'
import { green500, orange500, indigo600 } from 'material-ui/styles/colors'
import Home from 'material-ui/svg-icons/action/home'
import Cart from 'material-ui/svg-icons/action/shopping-cart'
import Build from 'material-ui/svg-icons/action/build'
import Scanner from 'material-ui/svg-icons/hardware/scanner'
import Laptop from 'material-ui/svg-icons/hardware/laptop'
import Assignment from 'material-ui/svg-icons/action/assignment'
import People from 'material-ui/svg-icons/social/people'
import Notifications from 'material-ui/svg-icons/social/notifications'
import Book from 'material-ui/svg-icons/action/book'
import RssFeed from 'material-ui/svg-icons/communication/rss-feed'

// Our own imports
import requirePermissions from './requirePermissions'
import SelectableList from './SelectableList'
import styles from './SideNav.css'

const cx = classnames.bind(styles)

const DevicesListItem = requirePermissions({
  permissions: ['device:admin', 'device:view']
})(ListItem)

const ResultsListItem = requirePermissions({
  permissions: ['result:admin', 'result:view']
})(ListItem)

class SideNav extends PureComponent {

  static propTypes = {
    open: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired
  }

  render() {
    return (
      <Drawer
        docked={ this.props.desktop }
        containerClassName={cx({
          'Drawer--desktop': this.props.desktop
        })}
        open={this.props.open}
        onRequestChange={ this.props.handleClose}
      >
        <SelectableList pathname={ this.props.pathname } desktop={ this.props.desktop } handleClose={ this.props.handleClose } >
          <Subheader>Dashboards</Subheader>
          <ListItem
            containerElement={<Link to="/dashboard" />}
            value={ '/dashboard' }
            leftIcon={<Home color={green500} />}
            className={styles.Drawer__ListItem}
            primaryText="Home"
          />
          <ListItem
            containerElement={<Link to="/dashboard/inventory" />}
            value={ '/dashboard/inventory' }
            leftIcon={<Cart color={orange500} />}
            className={styles.Drawer__ListItem}
            primaryText="Inventory"
          />
          <ListItem
            containerElement={<Link to="/dashboard/maintenance" />}
            value={ '/dashboard/maintenance' }
            leftIcon={<Build color={indigo600} />}
            className={styles.Drawer__ListItem}
            primaryText="Maintenance"
          />
          <Divider />
          <Subheader>Sections</Subheader>
          <DevicesListItem
            containerElement={<Link to="/device" />}
            value={ '/device' }
            leftIcon={<Scanner />}
            className={styles.Drawer__ListItem}
            primaryText="Devices"
          />
          <ResultsListItem
            containerElement={<Link to="/result" />}
            value={ '/result' }
            leftIcon={<Assignment />}
            className={styles.Drawer__ListItem}
            primaryText="Results"
          />
          <ListItem
            containerElement={<Link to="/person" />}
            value={ '/person' }
            leftIcon={<People />}
            className={styles.Drawer__ListItem}
            primaryText="Contacts"
          />
          <ListItem
            containerElement={<Link to="/site" />}
            value={ '/site' }
            leftIcon={<Laptop />}
            className={styles.Drawer__ListItem}
            primaryText="Sites"
          />
           <ListItem
            containerElement={<Link to="/router" />}
            value={ '/router' }
            leftIcon={<RssFeed />}
            className={styles.Drawer__ListItem}
            primaryText="Routers"
          />
            <ListItem
            containerElement={<Link to="/notification" />}
            value={ '/notification' }
            leftIcon={<Notifications />}
            className={styles.Drawer__ListItem}
            primaryText="Notifications"
          />
          <ListItem
            containerElement={<Link to="/report" />}
            value={ '/report' }
            leftIcon={<Book />}
            className={styles.Drawer__ListItem}
            primaryText="Reports"
          />
        </SelectableList>
      </Drawer>
    )
  }
}

export default SideNav
