import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import DelayShowingProgressBar from './DelayShowingProgressBar'

const cssClasses = classnames.bind(require('./DataTableProgressBar.css'))

const enhance = _.identity

const themes = {
  DelayShowingProgressBar: {
    indeterminate: cssClasses('DelayShowingProgressBar--indeterminate'),
  },
}

const DataTableProgressBar = ({ disabled }) =>
  <DelayShowingProgressBar
    disabled={disabled}
    mode="indeterminate"
    theme={themes.DelayShowingProgressBar}
  />

export default enhance(DataTableProgressBar)
