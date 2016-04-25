import React from 'react';

import Nav from './shared/Nav';
import SideNav from './shared/SideNav'

class LoggedInShell extends React.Component {

  constructor(props) {
    super(props);
    this.state = {drawerOpen: false};
  }

  handleHamburger = () => this.setState({drawerOpen: !this.state.drawerOpen})

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
