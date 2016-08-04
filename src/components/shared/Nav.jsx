// Imports from packages
import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import { Link } from 'react-router'

// Material-UI
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import Badge from 'material-ui/Badge'
import NotificationsIcon from 'material-ui/svg-icons/social/notifications'

class Nav extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  render() {
    return (
      <AppBar className="nav" onLeftIconButtonTouchTap={this.props.handleHamburger}
        title={ <Link to="/dashboard" >Aspect</Link> }
        children={
          <div>
            <Badge badgeContent={4} primary={true}
              className="nav-badge">
              <IconButton tooltip="You have 4 unread notifications">
                <NotificationsIcon color={'#fff'} />
              </IconButton>
            </Badge>
            <IconMenu iconButtonElement={
              <IconButton>
                <MoreVertIcon color={'#fff'} />
              </IconButton>}>
              <MenuItem primaryText="English" className="linky" onTouchTap={() => { this.props.handleLanguageChange('en', 'en-US') } } />
              <MenuItem primaryText="French" className="linky" onTouchTap={() => { this.props.handleLanguageChange('fr', 'fr-FR') } } />
              <MenuItem primaryText="Help" href="https://admin.gxalert.com" />
              <MenuItem primaryText="Sign out" className="linky" onTouchTap={ this.props.handleSignOut } />
            </IconMenu>
          </div>
        }/>
    )
  }
}

Nav.propTypes = {
  handleHamburger: React.PropTypes.func.isRequired,
  handleSignOut: React.PropTypes.func.isRequired
}

Nav.contextTypes = {
  router: React.PropTypes.object.isRequired
}

export default Nav