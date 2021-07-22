import classnames from 'classnames/bind'
import React from 'react'

import styles from './Accordion.css'

const cssClasses = classnames.bind(styles)

const AccordionDetail = ({ className, children, ...restProps }) => (
  <div className={cssClasses(className, 'Detail')} {...restProps}>
    <div className={cssClasses('Label')} />
    <div className={cssClasses('Detail__Content')}>{children}</div>
  </div>
)

export default AccordionDetail
