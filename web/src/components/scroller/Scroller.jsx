import React from 'react'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./Scroller.css'))

export const Scroller = ({ className, children, ...restProps }) => (
  <div className={cssClasses(className, 'Scroller')} {...restProps}>
    {children({
      ...restProps,
    })}
  </div>
)

export default Scroller
