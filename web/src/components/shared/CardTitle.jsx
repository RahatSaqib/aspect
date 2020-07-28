import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./CardTitle.css'))

const enhance = _.identity

export const Title = ({
  className,
  icon,
  title,
  renderRight = () => false,
}) => (
  <div className={cssClasses('Title', className)}>
    <div>
      {React.cloneElement(icon, {
        className: cssClasses(icon.props.className, 'Title__Icon'),
      })}
      &nbsp;
      <span className={cssClasses('Title__Text')}>{title}</span>
    </div>
    <div>{renderRight()}</div>
  </div>
)

export default enhance(Title)
