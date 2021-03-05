import React from 'react'
import classnames from 'classnames/bind'

import * as packageApi from '../../../../../api/package.json'
import * as packageWeb from '../../../../package.json'

const cssClasses = classnames.bind(require('./index.css'))

const PageFooter = () => {
  return (
    <div className={cssClasses('Footer-wrapper')}>
      {`web: ${packageWeb.version} - api: ${packageApi.version}`}
    </div>
  )
}

export default PageFooter
