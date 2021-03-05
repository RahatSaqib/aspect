import React from 'react'
import classnames from 'classnames/bind'
import Paper from '@material-ui/core/Paper'

import * as packageApi from '../../../../../api/package.json'
import * as packageWeb from '../../../../package.json'

const cssClasses = classnames.bind(require('./index.css'))

const PageFooter = () => {
  return (
    <Paper elevation={5} className={cssClasses('Footer-wrapper')}>
      <div className={cssClasses('Footer-section')}>
        &copy;{` SystemOne, 2012-2021`}
      </div>
      <div className={cssClasses('Footer-section', 'Footer-stretch')} />
      <div className={cssClasses('Footer-section')}>
        <div className={cssClasses('Footer-item', 'Footer-align-right')}>
          {`web: `}
          <strong>{packageWeb.version}</strong>
        </div>
        <div className={cssClasses('Footer-item', 'Footer-align-right')}>
          {`api: `}
          <strong>{packageApi.version}</strong>
        </div>
      </div>
    </Paper>
  )
}

export default PageFooter
