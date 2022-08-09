import classNames from 'classnames'
import React from 'react'
import MuiButton from '@mui/material/Button'

const AspectButton = ({ className, inverse, browseButton, ...restProps }) => (
  <MuiButton className={classNames(className, { inverse }, { browseButton })} {...restProps} />
)

export default AspectButton
