import React from 'react'
import { Button as MuiButton } from '@mui/material'
import classNames from 'classnames'

const AspectButton = ({ className, inverse, browseButton, ...restProps }) => (
  <MuiButton className={classNames(className, { inverse }, { browseButton })} {...restProps} />
)

export default AspectButton
