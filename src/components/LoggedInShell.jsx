// Imports from packages
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import { logoutStart, changeLanguage, toggleDrawer, closeDrawer } from '../action_creators/user_creators'

// Our own imports
import Nav from './shared/Nav'
import SideNav from './shared/SideNav'
import { ErrorDisplayContainer } from './shared/ErrorDisplay'

export class LoggedInShell extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.state = { desktop: true }
  }

  render() {
    const {pathname} = this.props.location

    return (
      <div>
        <Helmet title={pathname} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ErrorDisplayContainer />
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

LoggedInShell.propTypes = {
  children: React.PropTypes.object.isRequired
}

const mapStateToProps = (state) => {
  return {
    drawerOpen: state.getIn(['user', 'drawerOpen'])
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ logoutStart, changeLanguage, toggleDrawer, closeDrawer }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LoggedInShell)
