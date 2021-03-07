import React from 'react'
import classnames from 'classnames/bind'

import * as packageWeb from '../../../package.json'

const cssClasses = classnames.bind(require('./PageFooter.css'))

const Footer = () => {
  const {
    appVersions: { api, web },
  } = packageWeb
  return (
    <div className={cssClasses('page__footerWrapper')}>
      {`web: ${web} - api: ${api}`}
    </div>
  )
}

export default Footer
