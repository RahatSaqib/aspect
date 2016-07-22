import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'

import Nav from './shared/Nav'
import SideNav from './shared/SideNav'
import { ErrorDisplayContainer } from './shared/ErrorDisplay'

class LoggedInShell extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.state = { drawerOpen: true, desktop: true }
  }

  // user clicked on the menu-icon in the header
  handleHamburger = () => this.setState({drawerOpen: !this.state.drawerOpen})

  // user wants to close the side drawer
  handleSideClose = () => this.setState({drawerOpen: false})

  render() {
    return (
      <div>
        <ErrorDisplayContainer />
        <SideNav  open={this.state.drawerOpen}
                  desktop={ this.state.desktop }
                  handleClose={this.handleSideClose}
                  handleRequestChange={(drawerOpen) => this.setState({drawerOpen})} />
        <Nav handleHamburger={this.handleHamburger} />
        <div style={ this.state.drawerOpen && this.state.desktop ? { paddingLeft: '190px' } : {} } >
          {this.props.children}
        </div>
      </div>
    )
  }
}

LoggedInShell.propTypes = {
  children: React.PropTypes.object.isRequired
}

export default LoggedInShell
