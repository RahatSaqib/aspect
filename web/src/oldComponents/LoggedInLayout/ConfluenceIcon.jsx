import React from 'react'
import classnames from 'classnames/bind'
import styles from './index.css'

const cssClasses = classnames.bind(styles)

export const ConfluenceIcon = () => (
  <img className={cssClasses('ConfluenceIcon')} src={require('./logo_confluence.png')} alt="" />
)

export default ConfluenceIcon
