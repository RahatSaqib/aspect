import React from 'react'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import styles from './index.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

export const ConfluenceIcon = () => (
  <img className={cssClasses('ConfluenceIcon')} src={require('../../assets/logo_confluence.png')} alt="" />
)

export default enhance(ConfluenceIcon)
