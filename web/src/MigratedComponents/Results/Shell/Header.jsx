import React from 'react'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./Shell.css'))

const ShellHeader = ({ children, icon: Icon }) => (
  <div className={cssClasses('shell__header')}>
    <div className={cssClasses('shell__headerTitle')}>
      <div className={cssClasses('shell__headerIcon')}>
        <Icon />
      </div>
      <div className={cssClasses('shell__headerText')}>Header Title?</div>
    </div>
    <div className={cssClasses('shell__headerActions')}>{children}</div>
  </div>
)

export default ShellHeader
