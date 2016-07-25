import React, {Component, PropTypes} from 'react'
import {List, MakeSelectable} from 'material-ui/List'
import { browserHistory } from 'react-router'

let SelectableList = MakeSelectable(List)

function wrapState(ComposedComponent) {
  return class SelectableList extends Component {
    static propTypes = {
      children: PropTypes.node.isRequired,
      selectedPath: PropTypes.string.isRequired
    };

    componentWillMount() {
      this.setState({
        selectedPath: this.props.selectedPath
      })
    }

    handleRequestChange = (event, path) => {
      this.setState({
        selectedPath: path
      })

      // if we're not on the desktop and
      // user clicked a link, close side nav
      if (!this.props.desktop) {
        this.props.handleClose()
      }

      browserHistory.push(path)

    };

    render() {
      return (
        <ComposedComponent
          value={this.state.selectedPath}
          onChange={this.handleRequestChange}
        >
          {this.props.children}
        </ComposedComponent>
      )
    }
  }
}

SelectableList = wrapState(SelectableList)

export default SelectableList