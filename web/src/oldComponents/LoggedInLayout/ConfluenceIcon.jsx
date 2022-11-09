import React from 'react'
import classnames from 'classnames/bind'
import Logo from '../../assets/logo_confluence.png'
import styles from './index.css'

const cssClasses = classnames.bind(styles)

export const ConfluenceIcon = () => <img className={cssClasses('ConfluenceIcon')} src={Logo} alt="" />

export default ConfluenceIcon
