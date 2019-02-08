import classnames from 'classnames/bind'
import React from 'react'
import { compose, withStateHandlers } from 'recompose'
import Card from '@material-ui/core/Card'

const cssClasses = classnames.bind(require('./ExpansionPanel.css'))

const enhance = compose(
  withStateHandlers(
    ({ expanded = false }) => ({
      expanded,
    }),
    {
      handleExpandToggle: ({ expanded }) => () => ({
        expanded: !expanded,
      }),
    }
  )
)

export const ExpansionPanel = ({
  children,
  classes: classesMap,
  className,
  CollapseProps,
  defaultExpanded,
  disabled,
  expanded,
  handleExpandToggle,
  ...restProps
}) => {
  let header
  const newChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) {
      return null
    }

    if (child.type.displayName === 'ExpansionPanelHeader') {
      header = React.cloneElement(child, {
        disabled,
        expanded,
        handleExpandToggle,
      })
      return null
    }

    return child
  })
  return (
    <Card className={cssClasses('Container', className)} {...restProps}>
      {header}
      {expanded && newChildren}
    </Card>
  )
}

export default enhance(ExpansionPanel)
