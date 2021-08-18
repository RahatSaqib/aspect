import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import { FaBell } from 'react-icons/fa'

import styles from './FaBellZ.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

const FaBellZ = props => (
  <span {...props} className={cssClasses(props.className, 'FaBellZ')}>
    <FaBell />
  </span>
)

export default enhance(FaBellZ)
