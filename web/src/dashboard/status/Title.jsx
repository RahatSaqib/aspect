import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = _.identity

export const Title = ({ className, icon, title }) => (
  <div className={cssClasses('Title', className)}>
    {icon}
    <span className={cssClasses('Title__Label', className)}>{title}</span>
  </div>
)

export default enhance(Title)
