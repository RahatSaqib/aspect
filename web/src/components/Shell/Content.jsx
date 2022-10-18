import React from 'react'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import styles from './Shell.css'

const cssClasses = classnames.bind(styles)

const ShellContent = ({ children }) =>
  children ? <div className={cssClasses('shell__content')}>{children}</div> : null

ShellContent.defaultProps = {
  children: false,
}

ShellContent.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.bool, PropTypes.array, PropTypes.string]),
}

export default ShellContent
