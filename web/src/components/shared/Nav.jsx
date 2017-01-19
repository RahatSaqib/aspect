// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { Link } from 'react-router'

// Material-UI
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import Badge from 'material-ui/Badge'
import NotificationsIcon from 'material-ui/svg-icons/social/notifications'

// Our own imports
import styles from './Nav.css'

export class Nav extends PureComponent {

  static propTypes = {
    pageTitle: PropTypes.string,
    pagePath: PropTypes.string,
    handleHamburger: PropTypes.func.isRequired,
    handleSignOut: PropTypes.func.isRequired
  }

  renderPageFragment() {
    const { pageTitle, pagePath } = this.props

    if (pageTitle) {
      return (
        <span>
          {' - '}
          <Link className={styles.Brand} to={pagePath} >{pageTitle}</Link>
        </span>
      )
    }
  }

  render() {
    return (
      <AppBar
        onLeftIconButtonTouchTap={this.props.handleHamburger}
        title={(<span>
          <Link className={styles.Brand} to="/dashboard" >Aspect</Link>
          {this.renderPageFragment()}
        </span>)}
      >
        <div>
          <Badge secondary badgeContent={7} className={styles.Badge}>
            <IconButton tooltip="You have 7 unread notifications">
              <NotificationsIcon color={'#fff'} />
            </IconButton>
          </Badge>
          <IconMenu
            iconButtonElement={
              <IconButton>
                <MoreVertIcon color={'#fff'} />
              </IconButton>}
          >
            <MenuItem primaryText="Help" href="https://admin.gxalert.com" />
            <MenuItem
              primaryText="Account Details"
              containerElement={
                <Link to="/account-details/current" />}
            />
            <MenuItem
              primaryText="Sign out" className={styles.MenuItem}
              onTouchTap={this.props.handleSignOut}
            />
          </IconMenu>
        </div>
      </AppBar>
    )
  }
}

export default Nav
