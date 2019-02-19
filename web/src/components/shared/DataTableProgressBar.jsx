import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'

import DelayShowingProgressBar from './DelayShowingProgressBar'

const cssClasses = classnames.bind(require('./DataTableProgressBar.css'))

const enhance = _.identity

const DataTableProgressBar = ({ disabled }) => (
  <DelayShowingProgressBar
    disabled={disabled}
    variant="indeterminate"
    className={cssClasses('DelayShowingProgressBar--indeterminate')}
  />
)

export default enhance(DataTableProgressBar)
