import React from 'react';

import Nav from './shared/Nav';
import SideNav from './shared/SideNav'

class LoggedInShell extends React.Component {

  constructor(props) {
    super(props);
    this.state = {drawerOpen: false};
  }

  // user clicked on the menu-icon in the header
  handleHamburger = () => this.setState({drawerOpen: !this.state.drawerOpen})

  // user wants to close the side drawer
  handleSideClose = () => this.setState({drawerOpen: false})

  render() {
    return (
      <div>
        <SideNav  open={this.state.drawerOpen}
                  handleClose={this.handleSideClose}
                  handleRequestChange={(drawerOpen) => this.setState({drawerOpen})} />
        <Nav handleHamburger={this.handleHamburger} />
        {this.props.children}
      </div>
    );
  }
}

export default LoggedInShell;
