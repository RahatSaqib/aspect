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