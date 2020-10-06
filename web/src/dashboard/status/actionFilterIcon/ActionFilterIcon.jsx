import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./ActionFilterIcon.css'))

const enhance = identity

export const ActionFilterIcon = ({ className, category, status }) => (
  <div>
    <div
      className={cssClasses(
        className,
        'ActionFilterIcon',
        `ActionFilterIcon_${category}--${status}`
      )}
      alt={`${category}-${status}`}
    />
  </div>
)

export default enhance(ActionFilterIcon)
