// Imports from packages
import _ from 'lodash'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { logoutStart, changeLanguage, toggleDrawer, closeDrawer } from '../action_creators/user_creators'

// Our own imports
import Nav from './shared/Nav'
import SideNav from './shared/SideNav'
import { ErrorDisplayContainer } from './shared/ErrorDisplay'

// Titles for pages based on URL
const messages = defineMessages({
  '/device': {
    id: 'pages.DeviceList.title',
    defaultMessage: 'Devices'
  },
  '/site': {
    id: 'pages.SiteList.title',
    defaultMessage: 'Sites'
  },
  '/result': {
    id: 'pages.ResultList.title',
    defaultMessage: 'Results'
  },
  '/person': {
    id: 'pages.PersonList.title',
    defaultMessage: 'Contacts'
  },
  '/notification': {
    id: 'pages.NotificationList.title',
    defaultMessage: 'Notifications'
  },
  '/report': {
    id: 'pages.ReportList.title',
    defaultMessage: 'Reports'
  }
})

export class LoggedInShell extends React.PureComponent {

  static propTypes = {
    children: React.PropTypes.object.isRequired
  }

  state = {
    desktop: true
  }

  render() {

    const { formatMessage } = this.props.intl

    const pathname = this.props.location.pathname

    return (
      <div>
        <Helmet title={messages[pathname] ? formatMessage(messages[pathname]) : ''} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
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

function mapStateToProps(state) {
  return {
    drawerOpen: state.getIn(['user', 'drawerOpen'])
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ logoutStart, changeLanguage, toggleDrawer, closeDrawer }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LoggedInShell)

export const LoggedInShellContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(LoggedInShell)