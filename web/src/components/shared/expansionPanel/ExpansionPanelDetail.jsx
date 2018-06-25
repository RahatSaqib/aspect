import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./ExpansionPanel.css'))

const ExpansionPanelDetail = ({ className, children, ...restProps }) => (
  <div className={cssClasses(className, 'Detail')} {...restProps}>
    <div className={cssClasses('Label')} />
    <div className={cssClasses('Detail__Content')}>{children}</div>
  </div>
)

export default ExpansionPanelDetail
