import React from 'react'
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
                  handleClose={this.props.handleDrawerClose}
                  handleRequestChange={(drawerOpen) => this.setState({drawerOpen})} />
        <Nav handleHamburger={this.props.handleDrawerChange} handleSignOut={this.props.handleSignOut} handleLanguageChange={this.props.handleLanguageChange} />
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
  return {
    handleSignOut: () => {
      dispatch(logoutStart())
    },
    handleLanguageChange: (lang) => {
      dispatch(changeLanguage(lang))
    },
    handleDrawerChange: () => {
      dispatch(toggleDrawer())
    },
    handleDrawerClose: () => {
      dispatch(closeDrawer())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(LoggedInShell)
