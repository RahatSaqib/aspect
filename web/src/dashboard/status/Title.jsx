import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./Status.css'))

const enhance = _.identity

export const Title = ({ className, colorClassName, title }) =>
  <div className={cssClasses('Title', className)}>
    {colorClassName &&
      <div className={cssClasses('Title__Color', colorClassName)} />}
    {title}
  </div>

export default enhance(Title)
