import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'

import DelayShowingProgressBar from './DelayShowingProgressBar'

import styles from './DataTableProgressBar.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

const DataTableProgressBar = ({ disabled }) => (
  <DelayShowingProgressBar
    disabled={disabled}
    variant="indeterminate"
    className={cssClasses('DelayShowingProgressBar--indeterminate')}
  />
)

export default enhance(DataTableProgressBar)
