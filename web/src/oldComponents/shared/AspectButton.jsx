import React from 'react'
import MuiButton from '@mui/material/Button'
import classNames from 'classnames'

const AspectButton = ({ className, inverse, browseButton, ...restProps }) => (
  <MuiButton className={classNames(className, { inverse }, { browseButton })} {...restProps} />
)

export default AspectButton
