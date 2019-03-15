import PropTypes from 'prop-types'
import React from 'react'
import classnames from 'classnames/bind'
import Tooltip from '@material-ui/core/Tooltip'
import Help from 'react-icons/lib/md/help'

const cssClasses = classnames.bind(require('./AspectTooltip.css'))

const AspectTooltip = ({ title, children, showHelpIcon, ...restProps }) => (
  <Tooltip
    classes={{ tooltip: cssClasses('Tooltip') }}
    title={title}
    {...restProps}
  >
    <div>
      <span className={cssClasses('ChildrenContainer')}>{children}</span>
      {!showHelpIcon || <Help className={cssClasses('HelpIcon')} />}
    </div>
  </Tooltip>
)

AspectTooltip.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  showHelpIcon: PropTypes.bool,
}
AspectTooltip.defaultProps = {
  showHelpIcon: false,
}

export default AspectTooltip
