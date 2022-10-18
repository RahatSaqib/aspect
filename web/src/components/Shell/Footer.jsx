import React from 'react'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import styles from './Shell.css'

const cssClasses = classnames.bind(styles)

const ShellFooter = ({ children }) => (children ? <div className={cssClasses('shell__footer')}>{children}</div> : null)

ShellFooter.defaultProps = {
  children: false,
}

ShellFooter.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
}

export default ShellFooter
