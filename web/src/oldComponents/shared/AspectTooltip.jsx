import React from 'react'
import { Tooltip } from '@mui/material'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import IconProvider from '../../components/IconProvider'
import styles from './AspectTooltip.css'

const cssClasses = classnames.bind(styles)

const AspectTooltip = ({
  title,
  children,
  showHelpIcon,
  showPointerCursor,
  toolTipClass,
  toolTipContainerClass,
  iconClass,
  ...rest
}) => (
  <Tooltip classes={{ tooltip: cssClasses(toolTipClass) }} title={title} disableInteractive {...rest}>
    <div className={cssClasses(toolTipContainerClass)}>
      <span
        className={cssClasses('ChildrenContainer', {
          ChildrenContainer_clickable: showPointerCursor,
        })}
      >
        {children}
      </span>
      {showHelpIcon ? <IconProvider icon="MdHelp" className={cssClasses(iconClass)} /> : null}
    </div>
  </Tooltip>
)

AspectTooltip.defaultProps = {
  showHelpIcon: false,
  toolTipClass: 'Tooltip',
  toolTipContainerClass: null,
  iconClass: 'HelpIcon',
  showPointerCursor: true,
  title: '',
  children: null,
}

AspectTooltip.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
  showHelpIcon: PropTypes.bool,
  toolTipClass: PropTypes.string,
  toolTipContainerClass: PropTypes.string,
  iconClass: PropTypes.string,
  showPointerCursor: PropTypes.bool,
}

export default AspectTooltip
