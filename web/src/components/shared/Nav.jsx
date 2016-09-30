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

class Nav extends PureComponent {

  static propTypes = {
    handleHamburger: PropTypes.func.isRequired,
    handleSignOut: PropTypes.func.isRequired
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  render() {
    return (
      <AppBar
        onLeftIconButtonTouchTap={this.props.handleHamburger}
        title={ <Link className={styles.Brand} to="/dashboard" >Aspect</Link> }
      >
        <div>
          <Badge
            badgeContent={4}
            primary={true}
            className={styles.Badge}
          >
            <IconButton tooltip="You have 4 unread notifications">
              <NotificationsIcon color={'#fff'} />
            </IconButton>
          </Badge>
          <IconMenu iconButtonElement={
            <IconButton>
              <MoreVertIcon color={'#fff'} />
            </IconButton>}
          >
            <MenuItem primaryText="English" className={styles.MenuItem} onTouchTap={() => { this.props.handleLanguageChange('en', 'en-US') } } />
            <MenuItem primaryText="French" className={styles.MenuItem} onTouchTap={() => { this.props.handleLanguageChange('fr', 'fr-FR') } } />
            <MenuItem primaryText="Help" href="https://admin.gxalert.com" />
            <MenuItem primaryText="Sign out" className={styles.MenuItem} onTouchTap={ this.props.handleSignOut } />
          </IconMenu>
        </div>
      </AppBar>
    )
  }
}

export default Nav
