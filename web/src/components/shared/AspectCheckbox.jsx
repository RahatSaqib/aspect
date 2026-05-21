import React from 'react'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import { Checkbox } from '@mui/material'
import classNames from 'classnames'

const AspectCheckbox = ({ autoWidth, className, size = 'medium', color = 'primary', ...restProps }) => (
  <Checkbox
    className={classNames(className)}
    color={color}
    icon={<CheckBoxOutlineBlankIcon />}
    checkedIcon={<CheckBoxIcon />}
    size={size}
    {...restProps}
  />
)

export default AspectCheckbox
