import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

const cssClasses = classnames.bind(require('./index.css'))

const enhance = _.identity

export const ConfluenceIcon = () => (
  <img
    className={cssClasses('ConfluenceIcon')}
    src={require('./logo_confluence.png')}
    alt=""
  />
)

export default enhance(ConfluenceIcon)
