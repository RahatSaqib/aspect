import React from 'react'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./Shell.css'))

const ShellFooter = ({ children }) =>
  children ? (
    <div className={cssClasses('shell__footer')}>{children}</div>
  ) : null

export default ShellFooter
