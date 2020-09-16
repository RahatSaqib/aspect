import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./index.css'))

const enhance = identity

export const ConfluenceIcon = () => (
  <img
    className={cssClasses('ConfluenceIcon')}
    src={require('./logo_confluence.png')}
    alt=""
  />
)

export default enhance(ConfluenceIcon)
