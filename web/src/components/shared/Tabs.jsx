import PropTypes from 'prop-types'
import React, {
  cloneElement,
  createElement,
  Children,
  Component,
  isValidElement,
} from 'react'
import classNames from 'classnames'

import { withStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import MuiTabs from '@material-ui/core/Tabs'

const styles = () => ({
  container: {
    width: '100%',
    position: 'relative',
    textAlign: 'initial',
    height: 0,
    overflow: 'hidden',
    '&$selected': {
      height: 'auto',
      overflow: 'visible',
    },
  },
  selected: {},
})

const TabContainer = withStyles(styles)(({ classes, selected, children }) => (
  <div
    className={classNames(classes.container, {
      [classes.selected]: selected,
    })}
  >
    {children}
  </div>
))

const getTabs = children => {
  const tabs = []

  Children.forEach(children, tab => {
    if (isValidElement(tab)) {
      tabs.push(tab)
    }
  })
  return tabs
}

class Tabs extends Component {
  constructor(props) {
    super(props)
    const { initialSelectedIndex, children } = props
    this.state = {
      selectedIndex:
        initialSelectedIndex < getTabs(children).length
          ? initialSelectedIndex
          : 0,
    }
  }

  handleChange = (event, value) => {
    this.setState({ selectedIndex: value })
  }

  render() {
    const { children, initialSelectedIndex, ...restProps } = this.props
    const { selectedIndex } = this.state

    const tabContent = []
    const tabs = getTabs(children).map((tab, index) => {
      tabContent.push(
        createElement(
          TabContainer,
          {
            key: index,
            selected: index === selectedIndex,
          },
          tab.props.children
        )
      )

      return cloneElement(
        tab,
        {
          key: index,
        },
        undefined
      )
    })

    return (
      <div>
        <AppBar position="static">
          <MuiTabs
            value={selectedIndex}
            {...restProps}
            onChange={this.handleChange}
          >
            {tabs}
          </MuiTabs>
        </AppBar>
        {tabContent}
      </div>
    )
  }
}

Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  initialSelectedIndex: PropTypes.number,
}
Tabs.defaultProps = {
  initialSelectedIndex: 0,
}
export default Tabs
