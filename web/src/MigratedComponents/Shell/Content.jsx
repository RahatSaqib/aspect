import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./Shell.css'))

const ShellContent = ({ children }) =>
  children ? (
    <div className={cssClasses('shell__content')}>{children}</div>
  ) : null

ShellContent.defaultProps = {
  children: false,
}

ShellContent.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
}

export default ShellContent
