import React from 'react'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('../../Table.css'))

const PlaceholderCell = () => (
  <div className={cssClasses('placeholder__cell')} />
)

export default PlaceholderCell
