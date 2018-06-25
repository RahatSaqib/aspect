import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./CardTitle.css'))

const enhance = _.identity

export const Title = ({ className, icon, title }) => (
  <div className={cssClasses('Title', className)}>
    {React.cloneElement(icon, {
      className: cssClasses(icon.props.className, 'Title__Icon'),
    })}
    {title}
  </div>
)

export default enhance(Title)
