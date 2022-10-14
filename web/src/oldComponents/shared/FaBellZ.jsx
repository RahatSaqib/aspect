import React from 'react'
import classnames from 'classnames/bind'
import { FaBell } from 'react-icons/fa'
import styles from './FaBellZ.css'

const cssClasses = classnames.bind(styles)

const FaBellZ = props => (
  <span {...props} className={cssClasses(props.className, 'FaBellZ')}>
    <FaBell />
  </span>
)

export default FaBellZ
