import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./Shell.css'))

const ShellFooter = ({ className, children }) =>
  children ? (
    <div className={cssClasses('shell__footer', className)}>{children}</div>
  ) : null

ShellFooter.defaultProps = {
  className: null,
  children: false,
}

ShellFooter.propTypes = {
  className: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
}

export default ShellFooter
