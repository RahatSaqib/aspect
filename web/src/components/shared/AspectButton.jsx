import classNames from 'classnames'
import React from 'react'
import MuiButton from '@material-ui/core/Button'

const AspectButton = ({ className, inverse, ...restProps }) => (
  <MuiButton className={classNames(className, { inverse })} {...restProps} />
)

export default AspectButton
