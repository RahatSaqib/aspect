import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import DelayShowingProgressBar from './DelayShowingProgressBar'

const cssClasses = classnames.bind(require('./DataTableProgressBar.css'))

const enhance = _.identity

const DataTableProgressBar = ({ disabled }) =>
  <DelayShowingProgressBar
    disabled={disabled}
    mode="indeterminate"
    theme={{
      indeterminate: cssClasses('DelayShowingProgressBar--indeterminate'),
    }}
  />

export default enhance(DataTableProgressBar)
