import classnames from 'classnames/bind'
import React from 'react'
import { compose, withStateHandlers } from 'recompose'
import Card from '@material-ui/core/Card'

import styles from './Accordion.css'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  withStateHandlers(
    ({ expanded = false }) => ({
      expanded,
    }),
    {
      handleExpandToggle:
        ({ expanded }) =>
        () => ({
          expanded: !expanded,
        }),
    }
  )
)

export const Accordion = ({ children, className, disabled, expanded, handleExpandToggle, ...restProps }) => {
  let header
  const newChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) {
      return null
    }

    if (child.type.displayName === 'AccordionHeader') {
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

export default enhance(Accordion)
