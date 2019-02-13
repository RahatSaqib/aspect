import classnames from 'classnames/bind'
import React from 'react'
import { compose, setDisplayName } from 'recompose'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import IconButton from '@material-ui/core/IconButton'

const cssClasses = classnames.bind(require('./ExpansionPanel.css'))

const enhance = compose(setDisplayName('ExpansionPanelHeader'))

export const ExpansionPanelHeader = ({
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
    <div className={cssClasses('Label')}>
      {expanded ? expandedLabel || label : label}
    </div>
    <div className={cssClasses('Header__Content')}>
      {expanded ? children : collapsedChildren || children}
    </div>
    <IconButton
      disabled={disabled}
      className={cssClasses('Header__Icon', {
        'Header__Icon--disabled': disabled,
      })}
    >
      {expanded ? (
        <ExpandLessIcon style={{ fontSize: '20px' }} />
      ) : (
        <ExpandMoreIcon style={{ fontSize: '20px' }} />
      )}
    </IconButton>
  </div>
)

export default enhance(ExpansionPanelHeader)
