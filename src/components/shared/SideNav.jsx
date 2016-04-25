import React from 'react';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';

class SideNav extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Drawer docked={false} open={this.props.open} onRequestChange={this.props.handleClose}>
        <MenuItem onTouchTap={this.props.handleClose}>Menu Item</MenuItem>
        <MenuItem onTouchTap={this.props.handleClose}>Menu Item 2</MenuItem>
      </Drawer>
    );
  }
}

SideNav.propTypes = {
  open: React.PropTypes.bool.isRequired,
  handleClose: React.PropTypes.func.isRequired
};

export default SideNav;
