import React from 'react'
import classnames from 'classnames/bind'

import * as packageApi from '../../../../api/package.json'
import * as packageWeb from '../../../package.json'

const cssClasses = classnames.bind(require('./PageFooter.css'))

const Footer = () => (
  <div className={cssClasses('page__footerWrapper')}>
    {`web: ${packageWeb.version} - api: ${packageApi.version}`}
  </div>
)

export default Footer
