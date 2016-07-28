import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import { logoutStart, changeLanguage, toggleDrawer, closeDrawer } from '../action_creators/user_creators'

import Nav from './shared/Nav'
import SideNav from './shared/SideNav'
import { ErrorDisplayContainer } from './shared/ErrorDisplay'

class LoggedInShell extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.state = { desktop: true }
  }

  render() {
    return (
      <div>
        <ErrorDisplayContainer />
        <SideNav  open={this.props.drawerOpen}
                  desktop={ this.state.desktop }
                  pathname={ this.props.pathname }
                  handleClose={this.props.closeDrawer}
                  handleRequestChange={(drawerOpen) => this.setState({drawerOpen})} />
        <Nav handleHamburger={this.props.toggleDrawer} handleSignOut={this.props.logoutStart} handleLanguageChange={this.props.changeLanguage} />
        <div style={ this.props.drawerOpen && this.state.desktop ? { paddingLeft: '190px' } : {} } >
          {this.props.children}
        </div>
      </div>
    )
  }
}

LoggedInShell.propTypes = {
  children: React.PropTypes.object.isRequired
}

const mapStateToProps = (state, ownProps) => {
  return {
    drawerOpen: state.getIn(['user', 'drawerOpen']),
    pathname: ownProps.location.pathname
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ logoutStart, changeLanguage, toggleDrawer, closeDrawer }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LoggedInShell)
