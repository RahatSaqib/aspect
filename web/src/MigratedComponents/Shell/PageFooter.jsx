import React from 'react'
import classnames from 'classnames/bind'

import Footer from './Footer'
import * as packageApi from '../../../../api/package.json'
import * as packageWeb from '../../../package.json'

const cssClasses = classnames.bind(require('./Shell.css'))

const PageFooter = () => {
  return (
    <Footer className={cssClasses('shell__page-footer-wrapper')}>
      {`web: ${packageWeb.version} - api: ${packageApi.version}`}
    </Footer>
  )
}

export default PageFooter
