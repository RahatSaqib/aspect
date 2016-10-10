// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { logoutStart, changeLanguage, toggleDrawer, closeDrawer } from '../action_creators/user_creators'

// Our own imports
import Nav from './shared/Nav'
import SideNav from './shared/SideNav'
import { IdleDialogContainer } from './shared/idle/dialog/IdleDialog'
import { ErrorDisplayContainer } from './shared/ErrorDisplay'

export class LoggedInShell extends PureComponent {

  static propTypes = {
    children: PropTypes.object.isRequired
  }

  state = {
    desktop: true
  }

  render() {
    const pathname = this.props.location.pathname

    return (
      <div>
        <Helmet title="Aspect" defaultTitle="Aspect" />
        <ErrorDisplayContainer />
        <IdleDialogContainer />
        <SideNav  open={this.props.drawerOpen}
                  desktop={ this.state.desktop }
                  pathname={ pathname }
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

function mapStateToProps(state) {
  return {
    drawerOpen: state.getIn(['user', 'drawerOpen'])
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ logoutStart, changeLanguage, toggleDrawer, closeDrawer }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LoggedInShell)
