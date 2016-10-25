// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import { logoutStart, toggleDrawer, closeDrawer } from '../../auth/AuthRedux'
import Nav from '../shared/Nav'
import SideNav from '../shared/SideNav'
import { IdleDialogContainer } from '../../idle/dialog/IdleDialog'
import { ErrorDisplayContainer } from '../shared/ErrorDisplay'

export class LoggedInShell extends PureComponent {

  static propTypes = {
    children: PropTypes.object.isRequired
  }

  state = {
    pageTitle: null,
    desktop: true
  }

  handleSetPageTitle = pageTitle => {
    this.setState({ pageTitle })
  }

  render() {
    const { location } = this.props
    const { pathname } = location
    const { pageTitle } = this.state

    return (
      <div>
        <Helmet title="Aspect" defaultTitle="Aspect" />
        <ErrorDisplayContainer />
        <IdleDialogContainer />
        <SideNav open={this.props.drawerOpen}
                 desktop={ this.state.desktop }
                 pathname={ pathname }
                 handleClose={this.props.closeDrawer}
                 handleRequestChange={(drawerOpen) => this.setState({drawerOpen})} />
        <Nav
          pageTitle={pageTitle}
          pagePath={pathname}
          handleHamburger={this.props.toggleDrawer}
          handleSignOut={this.props.logoutStart}
        />
        <div style={ this.props.drawerOpen && this.state.desktop ? { paddingLeft: '190px' } : {} } >
          {React.cloneElement(this.props.children, {
            setPageTitle: this.handleSetPageTitle
          })}
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
  return bindActionCreators({ logoutStart, toggleDrawer, closeDrawer }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LoggedInShell)
