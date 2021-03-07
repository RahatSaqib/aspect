import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./Shell.css'))

const ShellFooter = ({ children }) =>
  children ? (
    <div className={cssClasses('shell__footer')}>{children}</div>
  ) : null

ShellFooter.defaultProps = {
  children: false,
}

ShellFooter.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
}

export default ShellFooter
// some
