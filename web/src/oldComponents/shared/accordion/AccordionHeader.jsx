import React from 'react'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { IconButton } from '@mui/material'
import classnames from 'classnames/bind'
import styles from './Accordion.css'

const cssClasses = classnames.bind(styles)

const AccordionHeader = ({
  label,
  expandedLabel,
  className,
  collapsedChildren,
  children,
  disabled,
  expanded,
  handleExpandToggle,
  handleKeyDown,
  ...restProps
}) => (
  <div
    className={cssClasses(className, 'Header')}
    onClick={() => (disabled ? null : handleExpandToggle())}
    onKeyDown={handleKeyDown}
    role="button"
    tabIndex="0"
    {...restProps}
  >
    <div className={cssClasses('Label')}>{expanded ? expandedLabel || label : label}</div>
    <div className={cssClasses('Header__Content')}>{expanded ? children : collapsedChildren || children}</div>
    <IconButton
      disabled={disabled}
      className={cssClasses('Header__Icon', {
        'Header__Icon--disabled': disabled,
      })}
    >
      {expanded ? <ExpandLessIcon style={{ fontSize: '20px' }} /> : <ExpandMoreIcon style={{ fontSize: '20px' }} />}
    </IconButton>
  </div>
)

export default AccordionHeader
