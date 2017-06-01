import PropTypes from 'prop-types'
// Imports from packages
import React, { Component } from 'react'
import { List, makeSelectable } from 'material-ui/List'

const SelectableListWithoutState = makeSelectable(List)

function wrapState(ComposedComponent) {
  return class SelectableList extends Component {
    static propTypes = {
      children: PropTypes.node.isRequired,
      pathname: PropTypes.string.isRequired,
      desktop: PropTypes.bool.isRequired,
      handleClose: PropTypes.func.isRequired,
    }

    handleRequestChange = () => {
      // if we're not on the desktop and
      // user clicked a link, close side nav
      if (!this.props.desktop) {
        this.props.handleClose()
      }
    }

    render() {
      return (
        <ComposedComponent
          value={this.props.pathname}
          onChange={this.handleRequestChange}
        >
          {this.props.children}
        </ComposedComponent>
      )
    }
  }
}

const SelectableList = wrapState(SelectableListWithoutState)

export default SelectableList
