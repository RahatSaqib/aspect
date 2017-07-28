import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { ProgressBar } from 'react-toolbox/lib/progress_bar'

const cssClasses = classnames.bind(require('./DataTableProgressBar.css'))

const enhance = _.identity

const DataTableProgressBar = ({ loading }) =>
  <ProgressBar
    mode={loading ? 'indeterminate' : 'determinate'}
    disabled={!loading}
    className={cssClasses('ProgressBar')}
    theme={{
      indeterminate: cssClasses('ProgressBar--indeterminate'),
    }}
  />

export default enhance(DataTableProgressBar)
