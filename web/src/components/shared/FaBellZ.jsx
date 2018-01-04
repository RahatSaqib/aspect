import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import FaBell from 'react-icons/lib/fa/bell'

const cssClasses = classnames.bind(require('./FaBellZ.css'))

const enhance = _.identity

const FaBellZ = props => (
  <span {...props} className={cssClasses(props.className, 'FaBellZ')}>
    <FaBell />
  </span>
)

export default enhance(FaBellZ)
