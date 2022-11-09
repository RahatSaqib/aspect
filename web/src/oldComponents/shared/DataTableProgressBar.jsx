import React from 'react'
import classnames from 'classnames/bind'
import styles from './DataTableProgressBar.css'
import DelayShowingProgressBar from './DelayShowingProgressBar'

const cssClasses = classnames.bind(styles)

const DataTableProgressBar = ({ disabled }) => (
  <DelayShowingProgressBar
    disabled={disabled}
    variant="indeterminate"
    className={cssClasses('DelayShowingProgressBar--indeterminate')}
  />
)

export default DataTableProgressBar
