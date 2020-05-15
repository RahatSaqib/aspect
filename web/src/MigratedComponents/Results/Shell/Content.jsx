import React from 'react'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./Shell.css'))

const ShellContent = ({ children }) =>
  children ? (
    <div className={cssClasses('shell__content')}>{children}</div>
  ) : null

export default ShellContent
