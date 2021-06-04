import PropTypes from 'prop-types'
import React from 'react'
import classnames from 'classnames/bind'
import Tooltip from '@material-ui/core/Tooltip'

import IconProvider from '../../MigratedComponents/IconProvider'

const cssClasses = classnames.bind(require('./AspectTooltip.css'))

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
    classes={{ tooltip: cssClasses(toolTipClass) }}
    title={title}
    {...rest}
  >
    <div className={cssClasses(toolTipContainerClass)}>
      <span
        className={cssClasses('ChildrenContainer', {
          ChildrenContainer_clickable: showPointerCursor,
        })}
      >
        {children}
      </span>
      {showHelpIcon ? (
        <IconProvider icon="MdHelp" className={cssClasses(iconClass)} />
      ) : null}
    </div>
  </Tooltip>
)

AspectTooltip.defaultProps = {
  showHelpIcon: false,
  toolTipClass: 'Tooltip',
  toolTipContainerClass: null,
  iconClass: 'HelpIcon',
  showPointerCursor: true,
}

AspectTooltip.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  showHelpIcon: PropTypes.bool,
  toolTipClass: PropTypes.string,
  toolTipContainerClass: PropTypes.string,
  iconClass: PropTypes.string,
  showPointerCursor: PropTypes.bool,
}

export default AspectTooltip
