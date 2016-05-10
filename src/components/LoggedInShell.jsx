import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'

import Nav from './shared/Nav'
import SideNav from './shared/SideNav'
import ErrorDisplay from './shared/ErrorDisplay'

class LoggedInShell extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
    this.state = {drawerOpen: false}
  }

  // user clicked on the menu-icon in the header
  handleHamburger = () => this.setState({drawerOpen: !this.state.drawerOpen})

  // user wants to close the side drawer
  handleSideClose = () => this.setState({drawerOpen: false})

  render() {
    return (
      <div>
        <ErrorDisplay />
        <SideNav  open={this.state.drawerOpen}
                  handleClose={this.handleSideClose}
                  handleRequestChange={(drawerOpen) => this.setState({drawerOpen})} />
        <Nav handleHamburger={this.handleHamburger} />
        {this.props.children}
      </div>
    )
  }
}

export default LoggedInShell
