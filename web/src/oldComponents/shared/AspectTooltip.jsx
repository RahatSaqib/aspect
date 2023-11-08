import React from 'react'
import { Tooltip } from '@mui/material'
import PropTypes from 'prop-types'
import IconProvider from '../../components/IconProvider'
import styles from './AspectTooltip.module.css'

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
  <Tooltip
    classes={{ tooltip: styles[toolTipClass] }}
    title={<span style={{ whiteSpace: 'pre-line' }}>{title}</span>}
    disableInteractive
    {...rest}
  >
    <div className={styles[toolTipContainerClass]}>
      <span className={`${styles.ChildrenContainer} ${showPointerCursor ? styles.ChildrenContainer_clickable : ''}`}>
        {children}
      </span>
      {showHelpIcon ? <IconProvider icon="MdHelp" className={styles[iconClass]} /> : null}
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
