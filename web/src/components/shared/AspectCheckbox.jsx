import classNames from 'classnames'
import React from 'react'
import Checkbox from '@material-ui/core/Checkbox'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'

const AspectCheckbox = ({
  className,
  size = 'large',
  color = 'primary',
  ...restProps
}) => (
  <Checkbox
    className={classNames(className)}
    color={color}
    icon={<CheckBoxOutlineBlankIcon fontSize={size} />}
    checkedIcon={<CheckBoxIcon fontSize={size} />}
    {...restProps}
  />
)

export default AspectCheckbox
