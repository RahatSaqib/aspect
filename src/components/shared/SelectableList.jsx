// Imports from packages
import React, {Component, PropTypes} from 'react'
import {List, MakeSelectable} from 'material-ui/List'

let SelectableList = MakeSelectable(List)

function wrapState(ComposedComponent) {
  return class SelectableList extends Component {
    static propTypes = {
      children: PropTypes.node.isRequired,
      pathname: PropTypes.string.isRequired
    };

    handleRequestChange = () => {
      // if we're not on the desktop and
      // user clicked a link, close side nav
      if (!this.props.desktop) {
        this.props.handleClose()
      }
    }

    render() {
      return (
        <ComposedComponent value={this.props.pathname} onChange={this.handleRequestChange}>
          {this.props.children}
        </ComposedComponent>
      )
    }
  }
}

SelectableList = wrapState(SelectableList)

export default SelectableList