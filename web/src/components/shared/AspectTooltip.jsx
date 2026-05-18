import React from 'react'
import { Tooltip } from '@mui/material'
import PropTypes from 'prop-types'
import IconProvider from '../IconProvider'
import styles from './AspectTooltip.module.css'

const AspectTooltip = ({
  title,
  children,
  showHelpIcon,
  showPointerCursor,
  toolTipContainerClass,
  iconClass,
  ...rest
}) => (
  <Tooltip
    classes={{ tooltip: styles.Tooltip }}
    title={<span style={{ whiteSpace: 'pre-line' }}>{title}</span>}
    disableInteractive
    {...rest}
  >
    <div className={toolTipContainerClass}>
      <span className={`${styles.ChildrenContainer} ${showPointerCursor ? styles.ChildrenContainer_clickable : ''}`}>
        {children}
      </span>
      {showHelpIcon ? <IconProvider icon="MdHelp" className={iconClass} /> : null}
    </div>
  </Tooltip>
)

AspectTooltip.defaultProps = {
  showHelpIcon: false,
  toolTipContainerClass: '',
  iconClass: styles.HelpIcon,
  showPointerCursor: true,
  title: '',
  children: null,
}

AspectTooltip.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
  showHelpIcon: PropTypes.bool,
  toolTipContainerClass: PropTypes.string,
  iconClass: PropTypes.string,
  showPointerCursor: PropTypes.bool,
}

export default AspectTooltip
