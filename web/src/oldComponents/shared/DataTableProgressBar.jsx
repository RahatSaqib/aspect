import React from 'react'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import styles from './DataTableProgressBar.css'
import DelayShowingProgressBar from './DelayShowingProgressBar'

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
