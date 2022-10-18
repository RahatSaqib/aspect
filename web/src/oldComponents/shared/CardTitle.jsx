import React from 'react'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import styles from './CardTitle.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

export const Title = ({ className, icon, title, renderRight = () => false }) => (
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
