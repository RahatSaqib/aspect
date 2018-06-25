import classnames from 'classnames/bind'
import React from 'react'
import { compose, setDisplayName } from 'recompose'
import MdExpandLess from 'react-icons/lib/md/expand-less'
import MdExpandMore from 'react-icons/lib/md/expand-more'
import { IconButton } from 'react-toolbox/lib/button'

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
    onClick={handleExpandToggle}
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
      icon={expanded ? <MdExpandLess /> : <MdExpandMore />}
    />
  </div>
)

export default enhance(ExpansionPanelHeader)
