import React from 'react'
import classnames from 'classnames/bind'
import packageWeb from '../../../package.json'
import styles from './PageFooter.css'

const cssClasses = classnames.bind(styles)

const Footer = () => {
  const { version } = packageWeb
  return <div className={cssClasses('page__footerWrapper')}>{`web: ${version}`}</div>
}

export default Footer
