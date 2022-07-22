import classNames from 'classnames'
import React from 'react'
import MuiButton from '@material-ui/core/Button'

const AspectButton = ({ className, inverse, browseButton, ...restProps }) => (
  <MuiButton className={classNames(className, { inverse }, { browseButton })} {...restProps} />
)

export default AspectButton
