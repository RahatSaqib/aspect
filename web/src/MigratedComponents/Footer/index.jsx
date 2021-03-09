import React from 'react'
import classnames from 'classnames/bind'

import * as packageWeb from '../../../package.json'

const cssClasses = classnames.bind(require('./PageFooter.css'))

const Footer = () => {
  const { version } = packageWeb
  return (
    <div className={cssClasses('page__footerWrapper')}>{`web: ${version}`}</div>
  )
}

export default Footer
