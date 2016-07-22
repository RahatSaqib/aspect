import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import Drawer from 'material-ui/Drawer'
import {List, ListItem} from 'material-ui/List'
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


class SideNav extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.handleMenuItemTouchTap = this.handleMenuItemTouchTap.bind(this)
  }

  handleMenuItemTouchTap() {
    // keep drawer open if on desktop and link in drawer is clicked
    if (!this.props.desktop) {
      this.props.handleClose
    }
  }

  render() {
    return (
      <Drawer docked={ this.props.desktop }
        containerStyle={ this.props.desktop ? { position: 'absolute', top: '68px', backgroundColor: '#f2f2f2', boxShadow: 'none' } : {} }
        open={this.props.open} onRequestChange={ this.props.handleClose}>
        <List>
          <Subheader>Dashboards</Subheader>
          <ListItem
            leftIcon={<Home color={green500} />}
            style={{ fontSize: 14 }} innerDivStyle={{ paddingLeft: 56 }}
            primaryText="Home"
            />
          <ListItem
            leftIcon={<Cart color={orange500} />}
            style={{ fontSize: 14 }} innerDivStyle={{ paddingLeft: 56 }}
            primaryText="Inventory"
            />
          <ListItem
            leftIcon={<Build color={indigo600} />}
            style={{ fontSize: 14 }} innerDivStyle={{ paddingLeft: 56 }}
            primaryText="Maintenance"
            />
        </List>
        <Divider />
        <List>
          <Subheader>Sections</Subheader>
          <ListItem
            leftIcon={<Scanner />}
            style={{ fontSize: 14 }} innerDivStyle={{ paddingLeft: 56 }}
            primaryText="Devices"
            />
          <ListItem
            leftIcon={<Assignment />}
            style={{ fontSize: 14 }} innerDivStyle={{ paddingLeft: 56 }}
            primaryText="Results"
            />
          <ListItem
            leftIcon={<People />}
            style={{ fontSize: 14 }} innerDivStyle={{ paddingLeft: 56 }}
            primaryText="Contacts"
            />
            <ListItem
            leftIcon={<Notifications />}
            style={{ fontSize: 14 }} innerDivStyle={{ paddingLeft: 56 }}
            primaryText="Notifications"
            />
          <ListItem
            leftIcon={<Book />}
            style={{ fontSize: 14 }} innerDivStyle={{ paddingLeft: 56 }}
            primaryText="Reports"
            />
        </List>
      </Drawer>
    )
  }
}

SideNav.propTypes = {
  open: React.PropTypes.bool.isRequired,
  handleClose: React.PropTypes.func.isRequired
}

export default SideNav
