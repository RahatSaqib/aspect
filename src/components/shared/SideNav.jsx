// Imports from packages
import React from 'react'
import { Link } from 'react-router'
import PureRenderMixin from 'react-addons-pure-render-mixin'

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
import Assignment from 'material-ui/svg-icons/action/assignment'
import People from 'material-ui/svg-icons/social/people'
import Notifications from 'material-ui/svg-icons/social/notifications'
import Book from 'material-ui/svg-icons/action/book'

// Our own imports
import SelectableList from './SelectableList'

class SideNav extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  render() {
    return (
      <Drawer docked={ this.props.desktop }
        containerClassName={ this.props.desktop ? 'drawer-desktop' : '' }
        open={this.props.open} onRequestChange={ this.props.handleClose}>
        <SelectableList pathname={ this.props.pathname } desktop={ this.props.desktop } handleClose={ this.props.handleClose } >
          <Subheader>Dashboards</Subheader>
          <ListItem
            containerElement={<Link to="/dashboard" />}
            value={ '/dashboard' }
            leftIcon={<Home color={green500} />}
            className="drawer-item"
            primaryText="Home"
            />
          <ListItem
            containerElement={<Link to="/dashboard/inventory" />}
            value={ '/dashboard/inventory' }
            leftIcon={<Cart color={orange500} />}
            className="drawer-item"
            primaryText="Inventory"
            />
          <ListItem
            containerElement={<Link to="/dashboard/maintenance" />}
            value={ '/dashboard/maintenance' }
            leftIcon={<Build color={indigo600} />}
            className="drawer-item"
            primaryText="Maintenance"
            />
        <Divider />
          <Subheader>Sections</Subheader>
          <ListItem
            containerElement={<Link to="/device" />}
            value={ '/device' }
            leftIcon={<Scanner />}
            className="drawer-item"
            primaryText="Devices"
            />
          <ListItem
            containerElement={<Link to="/result" />}
            value={ '/result' }
            leftIcon={<Assignment />}
            className="drawer-item"
            primaryText="Results"
            />
          <ListItem
            containerElement={<Link to="/person" />}
            value={ '/person' }
            leftIcon={<People />}
            className="drawer-item"
            primaryText="Contacts"
            />
            <ListItem
            containerElement={<Link to="/notification" />}
            value={ '/notification' }
            leftIcon={<Notifications />}
            className="drawer-item"
            primaryText="Notifications"
            />
          <ListItem
            containerElement={<Link to="/report" />}
            value={ '/report' }
            leftIcon={<Book />}
            className="drawer-item"
            primaryText="Reports"
            />
        </SelectableList>
      </Drawer>
    )
  }
}

SideNav.propTypes = {
  open: React.PropTypes.bool.isRequired,
  handleClose: React.PropTypes.func.isRequired,
  pathname: React.PropTypes.string.isRequired
}

export default SideNav
