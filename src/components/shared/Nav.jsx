import React from 'react'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import Badge from 'material-ui/Badge'
import NotificationsIcon from 'material-ui/svg-icons/social/notifications'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators/action_creators'

class Nav extends React.Component {

  constructor(props, context) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  render() {
    return (
        <AppBar onLeftIconButtonTouchTap={this.props.handleHamburger}
                title="aspect"
                children={
                  <div>
                    <Badge badgeContent={4} primary={true} badgeStyle={{top: 8, right: 8}}>
                      <NotificationsIcon color={'#fff'} />
                    </Badge>
                    <IconMenu iconButtonElement={
                      <IconButton>
                        <MoreVertIcon color={'#fff'} />
                      </IconButton>}>
                      <MenuItem primaryText="Refresh" />
                      <MenuItem primaryText="Help" linkButton={true} href="/" />
                      <MenuItem primaryText="Sign out" onTouchTap={this.props.handleSignOut} />
                    </IconMenu>
                    </div>
                  }/>
    )
  }
}

Nav.propTypes = {
  handleHamburger: React.PropTypes.func.isRequired
}

Nav.contextTypes =  {
  router: React.PropTypes.object.isRequired
}

const mapStateToProps = (state) => {
  return {
    user: state.get('user')
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    handleSignOut: () => {
      dispatch(actionCreators.logoutStart())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Nav)
