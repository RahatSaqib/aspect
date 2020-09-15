import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./ButtonGroup.css'))

const enhance = identity

const ButtonGroup = ({ isolated, adjacent, className, children }) => (
  <div
    className={cssClasses(className, 'ButtonGroup', {
      'ButtonGroup--isolated': isolated,
      'ButtonGroup--adjacent': adjacent,
    })}
  >
    {children}
  </div>
)

export default enhance(ButtonGroup)
