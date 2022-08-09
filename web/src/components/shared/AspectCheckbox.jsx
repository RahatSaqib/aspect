import classNames from 'classnames'
import React from 'react'
import Checkbox from '@mui/material/Checkbox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'

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
