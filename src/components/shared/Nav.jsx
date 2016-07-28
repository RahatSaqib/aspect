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
      <AppBar onLeftIconButtonTouchTap={this.props.handleHamburger}
        title={ <Link style={ { color: '#fff', textDecoration: 'none' } } to="/dashboard" >Aspect</Link> }
        titleStyle={ { cursor: 'pointer', fontWeight: '300', fontSize: '1.3rem' } }
        children={
          <div>
            <Badge  badgeContent={4} primary={true}
              badgeStyle={{ height: 20, width: 20, fontSize: 11, top: 6 }}
              style={{ padding: '6px 0 0 0' }}>
              <IconButton tooltip="You have 4 unread notifications" iconStyle={ { height: 20 } }>
                <NotificationsIcon color={'#fff'} />
              </IconButton>
            </Badge>
            <IconMenu iconButtonElement={
              <IconButton>
                <MoreVertIcon color={'#fff'} />
              </IconButton>}>
              <MenuItem primaryText="English" onTouchTap={() => { this.props.handleLanguageChange('en') } } />
              <MenuItem primaryText="French" onTouchTap={() => { this.props.handleLanguageChange('fr') } } />
              <MenuItem primaryText="Help" href="https://admin.gxalert.com" />
              <MenuItem primaryText="Sign out" onTouchTap={ this.props.handleSignOut } />
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